import { writeFile } from "node:fs/promises";

const requestBody = {
  "operationName": "AppConfig",
  "variables": {},
  "query": "query AppConfig($slug: String = \"defqon1\" , $w: FloatType = \"500\" , $h: FloatType = null ) { appConfig(filter: { appSlug: { eq: $slug }  } , orderBy: _createdAt_DESC) { __typename ...AppConfigFragment } }  fragment ImageFileFragment on FileField { __typename id height mimeType url(imgixParams: { crop: [faces,focalpoint] fit: crop h: $h w: $w q: 100 dpr: 2 } ) width }  fragment ColorFragment on ColorField { __typename alpha red green blue }  fragment StageCompactFragment on EventEditionStageRecord { __typename _modelApiKey id name image { __typename ...ImageFileFragment } position stageColor { __typename ...ColorFragment } titleColor { __typename ...ColorFragment } }  fragment ActCompactFragment on ActRecord { __typename _modelApiKey id name heroAsset { __typename ...ImageFileFragment } }  fragment PerformanceFragment on PerformanceBlockRecord { __typename _modelApiKey id name image { __typename ...ImageFileFragment } startTime endTime host live featured acts { __typename ...ActCompactFragment } }  fragment StageDayCompactFragment on EventEditionStageDayRecord { __typename _modelApiKey id cmsName stage { __typename ...StageCompactFragment } performances { __typename ...PerformanceFragment } }  fragment DayFullFragment on EventEditionDayRecord { __typename _modelApiKey id name date startTime endTime _allReferencingEventEditionStageDays(orderBy: _status_ASC) { __typename ...StageDayCompactFragment } }  fragment EventEditionFragment on EventEditionRecord { __typename _modelApiKey id name slug artwork { __typename ...ImageFileFragment } location kind _allReferencingEventEditionDays { __typename ...DayFullFragment } }  fragment AppCurrencyFragment on AppCurrencyRecord { __typename id isoCode }  fragment LatLonFragment on LatLonField { __typename latitude longitude }  fragment AppMapboxLayerFragment on AppMapboxLayerRecord { __typename _modelApiKey _updatedAt id key label url appMapboxNortheasternCorner { __typename ...LatLonFragment } appMapboxSouthwesternCorner { __typename ...LatLonFragment } appMapboxCenter { __typename ...LatLonFragment } }  fragment AppConfigFragment on AppConfigRecord { __typename _modelApiKey _updatedAt id appSlug appTicketStatus appMembershipEventId appExperiencesVisibleTo appTicketsaleReleaseDate appTravelsaleReleaseDate appMembersaleReleaseDate ticketUrl waitlistUrl resaleShopUrl appTimezone appBaseLocale enabledOptions appEvent { __typename id } eventEdition { __typename ...EventEditionFragment } appHomePage { __typename id } appCurrency { __typename ...AppCurrencyFragment } privacyPolicyPage { __typename ... on AppOnlyPageRecord { id } ... on PageRecord { id } } appMapboxLayers { __typename ...AppMapboxLayerFragment } }",
  "extensions": {
    "clientLibrary": {
      "name": "apollo-kotlin",
      "version": "4.4.2"
    }
  }
};

const res = await fetch("https://www.q-dance.com/graphql/", {
  method: "POST",
  headers: {
    "accept": "multipart/mixed;deferSpec=20220824, application/graphql-response+json, application/json",
    "x-environment": "dq26-prod",
    "x-apollo-expire-timeout": "2000",
    "content-type": "application/json",
    "user-agent": "okhttp/5.3.2"
  },
  body: JSON.stringify(requestBody)
});

console.log("HTTP", res.status, res.statusText);

const text = await res.text();
await writeFile("qdance_appconfig_exact_response.json", text, "utf8");
console.log("Saved qdance_appconfig_exact_response.json");

const data = JSON.parse(text);
const edition = data?.data?.appConfig?.eventEdition;

console.log("Edition:", edition?.name);
console.log("Slug:", edition?.slug);

const days = edition?._allReferencingEventEditionDays ?? [];
const stageCount = days.reduce((sum, day) => sum + (day._allReferencingEventEditionStageDays?.length ?? 0), 0);
const performanceCount = days.reduce(
  (sum, day) => sum + (day._allReferencingEventEditionStageDays ?? []).reduce((s, stage) => s + (stage.performances?.length ?? 0), 0),
  0
);
const timedPerformanceCount = days.reduce(
  (sum, day) => sum + (day._allReferencingEventEditionStageDays ?? []).reduce(
    (s, stage) => s + (stage.performances ?? []).filter((p) => p.startTime || p.endTime).length,
    0
  ),
  0
);

console.log({ dayCount: days.length, stageCount, performanceCount, timedPerformanceCount });