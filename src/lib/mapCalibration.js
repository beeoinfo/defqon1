const EARTH_RADIUS_M = 6371008.8;
const MIN_ACTIVE_CALIBRATION_POINTS = 3;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const getGpsDistanceMeters = (leftPoint, rightPoint) => {
  const leftLatitude = toRadians(Number(leftPoint?.latitude ?? leftPoint?.gpsLatitude));
  const rightLatitude = toRadians(Number(rightPoint?.latitude ?? rightPoint?.gpsLatitude));
  const deltaLatitude = rightLatitude - leftLatitude;
  const deltaLongitude = toRadians(
    Number(rightPoint?.longitude ?? rightPoint?.gpsLongitude) -
    Number(leftPoint?.longitude ?? leftPoint?.gpsLongitude)
  );
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getGpsOrigin = (points) => {
  const totals = points.reduce((result, point) => ({
    longitude: result.longitude + Number(point.gpsLongitude),
    latitude: result.latitude + Number(point.gpsLatitude),
  }), { longitude: 0, latitude: 0 });

  return {
    longitude: totals.longitude / points.length,
    latitude: totals.latitude / points.length,
  };
};

const gpsToLocalMeters = (point, origin) => {
  const latitudeScale = 111320;
  const longitudeScale = latitudeScale * Math.cos(toRadians(origin.latitude));

  return {
    x: (Number(point.gpsLongitude) - origin.longitude) * longitudeScale,
    y: (Number(point.gpsLatitude) - origin.latitude) * latitudeScale,
  };
};

const solveThreeByThree = (matrix, values) => {
  const rows = matrix.map((row, index) => [...row, values[index]]);

  for (let pivotIndex = 0; pivotIndex < 3; pivotIndex += 1) {
    let maxRowIndex = pivotIndex;

    for (let rowIndex = pivotIndex + 1; rowIndex < 3; rowIndex += 1) {
      if (Math.abs(rows[rowIndex][pivotIndex]) > Math.abs(rows[maxRowIndex][pivotIndex])) {
        maxRowIndex = rowIndex;
      }
    }

    if (Math.abs(rows[maxRowIndex][pivotIndex]) < 1e-10) {
      return null;
    }

    [rows[pivotIndex], rows[maxRowIndex]] = [rows[maxRowIndex], rows[pivotIndex]];

    const pivotValue = rows[pivotIndex][pivotIndex];
    for (let columnIndex = pivotIndex; columnIndex < 4; columnIndex += 1) {
      rows[pivotIndex][columnIndex] /= pivotValue;
    }

    for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
      if (rowIndex === pivotIndex) {
        continue;
      }

      const factor = rows[rowIndex][pivotIndex];
      for (let columnIndex = pivotIndex; columnIndex < 4; columnIndex += 1) {
        rows[rowIndex][columnIndex] -= factor * rows[pivotIndex][columnIndex];
      }
    }
  }

  return [rows[0][3], rows[1][3], rows[2][3]];
};

const fitAxis = (samples, targetKey) => {
  const normalMatrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const normalValues = [0, 0, 0];

  samples.forEach((sample) => {
    const row = [sample.x, sample.y, 1];
    const target = Number(sample[targetKey]);

    for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
      normalValues[rowIndex] += row[rowIndex] * target;

      for (let columnIndex = 0; columnIndex < 3; columnIndex += 1) {
        normalMatrix[rowIndex][columnIndex] += row[rowIndex] * row[columnIndex];
      }
    }
  });

  return solveThreeByThree(normalMatrix, normalValues);
};

export const buildMapCalibrationTransform = (points) => {
  const activePoints = (points ?? []).filter((point) => point?.isActive !== false);

  if (activePoints.length < MIN_ACTIVE_CALIBRATION_POINTS) {
    return null;
  }

  const origin = getGpsOrigin(activePoints);
  const samples = activePoints.map((point) => ({
    ...gpsToLocalMeters(point, origin),
    mapLongitude: Number(point.mapLongitude),
    mapLatitude: Number(point.mapLatitude),
  }));
  const longitudeCoefficients = fitAxis(samples, 'mapLongitude');
  const latitudeCoefficients = fitAxis(samples, 'mapLatitude');

  if (!longitudeCoefficients || !latitudeCoefficients) {
    return null;
  }

  const errors = samples.map((sample) => {
    const predictedLongitude =
      longitudeCoefficients[0] * sample.x + longitudeCoefficients[1] * sample.y + longitudeCoefficients[2];
    const predictedLatitude =
      latitudeCoefficients[0] * sample.x + latitudeCoefficients[1] * sample.y + latitudeCoefficients[2];

    return Math.hypot(predictedLongitude - sample.mapLongitude, predictedLatitude - sample.mapLatitude);
  });

  return {
    origin,
    pointCount: activePoints.length,
    longitudeCoefficients,
    latitudeCoefficients,
    meanMapError: errors.reduce((total, error) => total + error, 0) / errors.length,
  };
};

export const projectGpsToMap = (position, transform) => {
  if (!position || !transform) {
    return null;
  }

  const localPoint = gpsToLocalMeters({
    gpsLongitude: position.longitude,
    gpsLatitude: position.latitude,
  }, transform.origin);

  return {
    longitude:
      transform.longitudeCoefficients[0] * localPoint.x +
      transform.longitudeCoefficients[1] * localPoint.y +
      transform.longitudeCoefficients[2],
    latitude:
      transform.latitudeCoefficients[0] * localPoint.x +
      transform.latitudeCoefficients[1] * localPoint.y +
      transform.latitudeCoefficients[2],
  };
};

export const hasEnoughCalibrationPoints = (points) => (
  (points ?? []).filter((point) => point?.isActive !== false).length >= MIN_ACTIVE_CALIBRATION_POINTS
);

export { MIN_ACTIVE_CALIBRATION_POINTS };
