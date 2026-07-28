const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const helperStart = appSource.indexOf("function getImarInstitutionValues");
const helperEnd = appSource.indexOf("function openImarOsbInstitutionModal", helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, "Imar kurum secimi yardimcilari bulunamadi.");

const foldTurkish = (value) => String(value || "")
  .toLocaleUpperCase("tr-TR")
  .replaceAll("İ", "I")
  .replaceAll("Ş", "S")
  .replaceAll("Ğ", "G")
  .replaceAll("Ü", "U")
  .replaceAll("Ö", "O")
  .replaceAll("Ç", "C");
const context = {
  state: {
    fields: {
      titleCity: "Bursa",
      titleDistrict: "Karacabey",
      imarInfoInstitution: "Karacabey Belediyesi",
    },
  },
  imarOsbInstitutionOption: "OSB Bölge Müdürlüğü",
  metropolitanProvinceNames: new Set(["Bursa", "İstanbul"].map(foldTurkish)),
  foldTurkish,
  normalizeReportTitleText: (value) => String(value || "").trim(),
  normalizeMultiCheckboxValues: (values) => [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))],
  formatMultiCheckboxValue: (values) => values.join(", "),
};
vm.runInNewContext(appSource.slice(helperStart, helperEnd), context);

assert.deepEqual(
  [...context.getImarInstitutionOptions()],
  ["Karacabey Belediyesi", "Bursa Büyükşehir Belediyesi", "OSB Bölge Müdürlüğü"],
  "Buyuksehir ilinde ilce ve buyuksehir belediyesi secenekleri olusmadi.",
);

context.state.fields = {
  titleCity: "Yalova",
  titleDistrict: "Armutlu",
  imarInfoInstitution: "Armutlu Belediyesi",
};
assert.deepEqual(
  [...context.getImarInstitutionOptions()],
  ["Armutlu Belediyesi", "Yalova İl Özel İdaresi", "OSB Bölge Müdürlüğü"],
  "Buyuksehir olmayan ilde Il Ozel Idaresi secenegi olusmadi.",
);

context.state.fields.imarInfoInstitution = "Armutlu Belediyesi, İmar ve Şehircilik Müdürlüğü";
assert.ok(
  context.getImarInstitutionOptions().includes("İmar ve Şehircilik Müdürlüğü"),
  "PDF'den gelen standart disi kurum degeri korunmadi.",
);
assert.equal(
  context.formatImarOsbInstitutionName("Hasanağa"),
  "Hasanağa Organize Sanayi Bölge Müdürlüğü",
  "OSB adi tam kurum adina donusturulemedi.",
);

const projectStart = appSource.indexOf("function getSelectedProjectInstitutions");
const projectEnd = appSource.indexOf("function getProjectDetailLabelPrefix", projectStart);
assert(projectStart >= 0 && projectEnd > projectStart, "Proje kurum ozeti fonksiyonlari bulunamadi.");
const projectContext = {
  state: {
    fields: {
      projectInstitution: "Belediye, Hasanağa Organize Sanayi Bölge Müdürlüğü",
    },
  },
  imarOsbInstitutionOption: "OSB Bölge Müdürlüğü",
  foldTurkish,
  normalizeReportTitleText: (value) => String(value || "").trim(),
  getProjectReviewDistrictText: () => "Nilüfer",
  joinTurkishList: (values) => values.join(" ve "),
};
vm.runInNewContext(appSource.slice(projectStart, projectEnd), projectContext);
assert.equal(
  projectContext.projectInstitutionIncludes("OSB Bölge Müdürlüğü"),
  true,
  "Tam OSB kurum adi proje kurumu olarak algilanmadi.",
);
assert.equal(
  projectContext.buildProjectReviewInstitutionSummary(),
  "Nilüfer Belediyesi ve Hasanağa Organize Sanayi Bölge Müdürlüğü",
  "Proje kurum ozetinde OSB'nin tam adi korunmadi.",
);

const sourceStart = appSource.indexOf("function formatImarInstitutionSource");
const sourceEnd = appSource.indexOf("function composeImarConditionList", sourceStart);
assert(sourceStart >= 0 && sourceEnd > sourceStart, "Imar kurum kaynak metni fonksiyonu bulunamadi.");
vm.runInNewContext(appSource.slice(sourceStart, sourceEnd), context);
assert.equal(
  context.formatImarInstitutionSource("Karacabey Belediyesi, Bursa Büyükşehir Belediyesi"),
  "Karacabey Belediyesi ve Bursa Büyükşehir Belediyesinden",
  "Coklu kurum imar aciklamasina dogru baglanmadi.",
);

assert.match(
  appSource,
  /key:\s*"imarInfoInstitution"[^}]+type:\s*"multiCheckbox"[^}]+autoFill:\s*true/,
  "Bilgi alinan kurum alani PDF destekli coklu secim olarak tanimlanmadi.",
);
assert.match(
  appSource,
  /field\.key === "projectInstitution" && input\.value === imarOsbInstitutionOption/,
  "Proje incelenen kurum OSB secenegi ad giris penceresine baglanmadi.",
);

console.log("Imar institution control tests passed.");
