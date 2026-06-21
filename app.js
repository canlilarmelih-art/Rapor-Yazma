const imarPlanScaleOptions = ["", "1/1.000", "1/5.000", "1/25.000", "1/100.000"];
const imarLegendOptions = [
  "",
  "Konut",
  "Ticaret",
  "Konut + Ticaret",
  "Konut Dışı Kentsel Çalışma",
  "Özel Proje Alanı",
  "Merkezi İş",
  "Ofis ve İş Merkezi",
  "Küçük Sanayi",
  "Sanayi",
  "Organize Sanayi Bölgesi",
  "Depolama",
  "Akaryakıt ve LPG İstasyonu",
  "Eğitim Tesis",
  "Sağlık Tesis",
  "Belediye Hizmet",
  "Resmi Kurum",
  "Dini Tesis",
  "Kültürel Tesis",
  "Spor",
  "Mesire ve Piknik",
  "Tarihi ve Kültürel Sit",
  "Arkeolojik Sit",
  "Doğal Sit",
  "Kentsel Sit",
  "Tarım",
  "Köy Yerleşik Alanı",
];
const imarOrderOptions = ["", "Ayrık", "Bitişik", "Blok", "İkiz", "Kütle", "Serbest"];
const imarFloorCountOptions = ["", "Serbest", ...Array.from({ length: 40 }, (_, index) => String(index + 1))];
const regionUsePurposeOptions = [
  "zemin ve normal katları konut",
  "zemin katları işyeri, normal katları konut",
  "zemin katları işyeri, normal katları ofis",
  "Villa Tipi Konut",
  "Müstakil Konut",
  "Müstakil Villa Tipi Konut",
  "Kırsal Nitelikli Müstakil Konut",
  "Yazlık/İkinci Konut Amaçlı Müstakil Yapı",
  "İnşaatı Yeni Tamamlanmış veya İnşaatı Devam Eden Konut",
  "İnşaatı Yeni Tamamlanmış veya İnşaatı Devam Eden Konut + Ticaret",
];
const industrialRegionUsePurposeOptions = [
  "Küçük Sanayi Tesisleri",
  "Sanayi Tesisleri",
  "Ağır Sanayi Tesisleri",
  "Depolama Tesisleri",
  "Lojistik Tesisleri",
];
const caseBankOptions = [
  "",
  "Akbank T.A.Ş.",
  "Türkiye Halk Bankası A.Ş.",
  "Türkiye İş Bankası A.Ş.",
  "Kuveyt Türk Katılım Bankası A.Ş.",
  "Türkiye Vakıflar Bankası T.A.O.",
  "Vakıf Katılım Bankası A.Ş.",
  "Yapı ve Kredi Bankası A.Ş.",
  "T.C. Ziraat Bankası A.Ş.",
];

const sections = [
  {
    id: "case",
    title: "Dosya ve Rapor",
    badge: "Başlangıç",
    description:
      "Banka, randevu, iş dosyası ve belge kaynakları burada yönetilir. Bu ekran hem mobilde hızlı başlangıç hem masaüstünde üretim kontrolü için merkezdir.",
    fields: [
      {
        key: "bank",
        label: "Banka",
        type: "select",
        required: true,
        critical: true,
        options: caseBankOptions,
      },
      { key: "customerName", label: "Müşteri / talep eden", type: "text" },
      { key: "caseName", label: "İş adı", type: "text", required: true, critical: true },
      {
        key: "appointmentType",
        label: "Randevu türü",
        type: "select",
        critical: true,
        options: ["", "İçi görülmüştür", "Dışarıdan ekspertiz", "Kısıtlı inceleme"],
      },
      {
        key: "legalUsageNature",
        label: "Yasal Kullanım Niteliği",
        type: "select",
        options: ["", "Konut", "İşyeri", "Ofis", "Arsa", "Arazi", "Ticari Bina", "Sanayi Tesisi"],
      },
      {
        key: "usageNatureDifference",
        label: "Yasal/Mevcut Kullanım Türü Arasında Fark Var Mı?",
        type: "checkbox",
        checkedValue: "Evet",
        uncheckedValue: "Hayır",
        defaultValue: "Hayır",
      },
      {
        key: "currentUsageNature",
        label: "Mevcut Kullanım Niteliği",
        type: "select",
        options: ["", "Konut", "İşyeri", "Ofis", "Arsa", "Arazi", "Ticari Bina", "Sanayi Tesisi"],
      },
      {
        key: "ownershipType",
        label: "Mülkiyet",
        type: "select",
        options: ["", "Dikey Kat İrtifakı", "Yatay Kat İrtifakı", "Müstakil Bina", "Arsa", "Tarla"],
        critical: true,
        wide: true,
      },
      {
        key: "appointmentDate",
        label: "Randevu tarihi",
        type: "date",
        source: "businessDate",
        autoFill: true,
        critical: true,
        note: "Otomatik gelir; kullanıcı isterse değiştirebilir.",
      },
      {
        key: "municipalityInspectionDate",
        label: "Belediye inceleme tarihi",
        type: "date",
        source: "businessDate",
        autoFill: true,
        critical: true,
        note: "İlk değer randevu tarihi ile aynıdır; kullanıcı değiştirebilir.",
      },
    ],
    uploads: [
      {
        id: "takbis",
        title: "TAKBİS PDF",
        hint: "İlk aşamada tapu kayıt bilgilerini okuyacak.",
        accept: ".pdf,application/pdf",
      },
      {
        id: "address",
        title: "Adres Kodu PDF / Görsel",
        hint: "PDF metni veya OCR ile UAVT ve adres alanlarını ön dolduracak.",
        accept: ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*",
      },
      {
        id: "ekb",
        title: "EKB PDF / Görsel",
        hint: "Enerji kimlik belge no, tarihler ve enerji/emisyon sınıflarını okuyacak.",
        accept: ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*",
      },
      {
        id: "kml",
        title: "KML / Konum",
        hint: "OpenStreetMap altlığı üzerinde gösterilecek; koordinat ve pafta bilgisi otomatik önerilecek.",
        accept: ".kml,application/vnd.google-earth.kml+xml,application/xml,text/xml",
      },
      {
        id: "imar",
        title: "E-İmar PDF / Görsel",
        hint: "Belediye e-imar çıktısından plan ve yapılaşma koşullarını otomatik okur.",
        accept: ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*",
      },
    ],
  },
  {
    id: "address",
    title: "Adres ve Konum",
    badge: "Saha",
    description:
      "İdari adres, koordinat, ulaşım tarifi ve yakın çevre bilgileri raporun konum omurgasını oluşturur.",
    fields: [
      { key: "city", label: "İl", type: "text", required: true, critical: true },
      { key: "district", label: "İlçe", type: "text", required: true, critical: true },
      { key: "neighborhood", label: "İdari mahalle", type: "text", required: true, critical: true },
      { key: "street", label: "Sokak / cadde", type: "text", critical: true },
      { key: "addressSiteName", label: "Site / Apartman", type: "text" },
      { key: "addressBlockName", label: "Blok", type: "text" },
      { key: "outerDoor", label: "Dış kapı no", type: "text", critical: true },
      { key: "addressFloor", label: "Kat", type: "text" },
      { key: "innerDoor", label: "İç kapı no", type: "text" },
      { key: "uavt", label: "UAVT", type: "text" },
      { key: "postalCode", label: "Posta kodu", type: "text", lookup: true },
      { key: "latitude", label: "Enlem", type: "text", critical: true },
      { key: "longitude", label: "Boylam", type: "text", critical: true },
      { key: "boundNeighborhood", label: "Bağlı mahalle / köy", type: "text" },
      { key: "boundNeighborhoodDistance", label: "Bağlı mahalle merkezi mesafesi", type: "text" },
      { key: "nearestNeighborhood", label: "En yakın mahalle / köy", type: "text" },
      { key: "nearestNeighborhoodDistance", label: "Mahalle / köy mesafesi", type: "text" },
      { key: "districtCenterDistance", label: "İlçe merkezine mesafe", type: "text" },
      { key: "cityCenterDistance", label: "İl merkezine mesafe", type: "text" },
      { key: "addressRaw", label: "Adres kodu ham metni", type: "textarea", hidden: true },
      { key: "mainArtery", label: "Ulaşım ana arteri", type: "artery" },
      {
        key: "mainArteryProximity",
        label: "Ana arter mesafesi",
        type: "select",
        defaultValue: "yakın",
        options: ["", "yakın", "orta yakın", "uzak"],
      },
      { key: "transport", label: "Ulaşım tarifi", type: "textarea" },
      { key: "nearby", label: "Yakın çevresi", type: "textarea" },
      {
        key: "environmentRegionType",
        label: "Çevresel özellik bölge türü",
        type: "select",
        defaultValue: "Konut Bölgesi",
        options: ["", "Konut Bölgesi", "Ticaret Bölgesi", "Sanayi Bölgesi", "Tarımsal Alan"],
        wide: true,
      },
      {
        key: "agriculturalActivityDensity",
        label: "Tarımsal faaliyet yoğunluğu",
        type: "select",
        defaultValue: "Yoğun",
        options: ["", "Yoğun", "Orta", "Seyrek"],
      },
      {
        key: "agriculturalActivityTypes",
        label: "Tarımsal faaliyet türü",
        type: "multiCheckbox",
        options: ["Bitkisel Üretim", "Hayvancılık", "Tarıma Dayalı Kullanım"],
      },
      {
        key: "agriculturalSuitability",
        label: "Tarımsal kullanım uygunluğu",
        type: "select",
        defaultValue: "Uygun",
        options: ["", "Uygun", "Kısmen Uygun", "Uygun Değil"],
      },
      {
        key: "regionBuildOrder",
        label: "Bölge yapılaşma nizamı",
        type: "multiCheckbox",
        options: ["ayrık", "bitişik", "blok", "ikiz", "karma"],
      },
      {
        key: "regionFloorRange",
        label: "Bölge yapılaşma kat adedi",
        type: "multiCheckbox",
        options: Array.from({ length: 30 }, (_, index) => String(index + 1)),
        maxSelections: 2,
        rangeSummary: true,
      },
      {
        key: "regionIncomeLevel",
        label: "Bölge gelir seviyesi",
        type: "select",
        options: ["", "alt", "alt ve orta", "orta", "orta ve üst", "üst"],
      },
      {
        key: "infrastructureLevel",
        label: "Altyapı olanakları",
        type: "select",
        options: ["", "zayıf", "orta", "iyi", "çok iyi"],
      },
      {
        key: "developmentSpeed",
        label: "Yapılaşma hızı",
        type: "select",
        options: ["", "düşük", "orta", "yüksek"],
      },
      {
        key: "regionBuildingAge",
        label: "Bölge yapı yaşı",
        type: "select",
        options: ["", "yeni", "5-10", "10-15", "15-20", "20-25", "20-30", "30-40"],
      },
      {
        key: "developmentDensity",
        label: "Yapılaşma yoğunluğu",
        type: "select",
        options: ["", "düşük", "orta", "yüksek"],
      },
      {
        key: "socialNeeds",
        label: "Sos. ihtiyaçlar",
        type: "select",
        options: ["", "kısa", "orta", "uzun"],
      },
      {
        key: "regionUsePurpose",
        label: "Bölge yapılaşma kul. amacı",
        type: "multiCheckbox",
        options: regionUsePurposeOptions,
      },
      {
        key: "planningPrincipleHarmony",
        label: "Plancılık ilkeleri ile uyumu",
        type: "select",
        options: ["", "uyumludur", "kısmen uyumludur", "uyumlu değildir"],
      },
      {
        key: "commercialFunctionDensity",
        label: "Ticari fonksiyon yoğunluğu",
        type: "select",
        defaultValue: "Yoğun",
        options: ["", "Yoğun", "Orta Yoğun", "Seyrek"],
      },
      {
        key: "commercialFirmType",
        label: "Ticari firma tipi",
        type: "select",
        defaultValue: "Orta",
        options: ["", "Küçük", "Orta", "Büyük"],
      },
      {
        key: "commercialFrontageRoadType",
        label: "Cepheli olduğu yol",
        type: "select",
        defaultValue: "Taşıt Yolu",
        options: ["", "Taşıt Yolu", "Yaya Yolu"],
      },
      {
        key: "commercialDevelopmentCompleted",
        label: "Bölgede yapılaşma tamamlanmış mı?",
        type: "select",
        defaultValue: "Evet",
        options: ["", "Evet", "Hayır"],
      },
      {
        key: "environmentDescription",
        label: "Çevresel özellikler açıklaması",
        type: "textarea",
        wide: true,
      },
    ],
  },
  {
    id: "title",
    title: "Tapu ve Mülkiyet",
    badge: "TAKBİS",
    description:
      "Ada, parsel, bağımsız bölüm, tapu tarihi ve malik bilgileri TAKBİS verisi ile kullanıcı onayını birleştirir.",
    fields: [
      {
        key: "titleOwnershipKind",
        label: "Mülkiyet Türü",
        type: "select",
        options: ["", "Tam Mülkiyet", "Hisseli Mülkiyet"],
      },
      { key: "titleRecordChange", label: "Tapu kaydı değişikliği var mı?", type: "titleRecordChange" },
      { key: "titlePropertyId", label: "Taşınmaz kimlik no", type: "text" },
      { key: "groundType", label: "Zemin tipi", type: "text" },
      { key: "titleCity", label: "Tapu il", type: "text" },
      { key: "titleDistrict", label: "Tapu ilçe", type: "text" },
      { key: "titleNeighborhood", label: "Tapu mahalle", type: "text" },
      { key: "locationName", label: "Mevkii", type: "text" },
      { key: "blockNo", label: "Ada", type: "text", required: true, critical: true },
      { key: "parcelNo", label: "Parsel", type: "text", required: true, critical: true },
      { key: "oldBlockNo", label: "Eski Ada", type: "text" },
      { key: "oldParcelNo", label: "Eski Parsel", type: "text" },
      { key: "sheetNo", label: "Pafta", type: "text" },
      { key: "landArea", label: "Ana taşınmaz yüzölçümü", type: "text" },
      { key: "titleQuality", label: "Bağımsız Bölüm Niteliği", type: "text", required: true, critical: true },
      { key: "titleBlockName", label: "Blok", type: "text" },
      { key: "titleFloor", label: "Tapu katı", type: "text", critical: true },
      { key: "unitNo", label: "Bağımsız Bölüm No", type: "text", required: true, critical: true },
      { key: "share", label: "Arsa payı", type: "text" },
      { key: "denominator", label: "Arsa Payda", type: "text" },
      { key: "registryVolume", label: "Cilt", type: "text" },
      { key: "registryPage", label: "Sayfa", type: "text" },
      { key: "mainPropertyQuality", label: "Ana taşınmaz niteliği", type: "text", wide: true },
    ],
    table: {
      title: "Malikler",
      columns: ["Malik", "Hisse", "Edinme sebebi", "Tapu tarihi", "Yevmiye"],
      rows: 3,
    },
  },
  {
    id: "encumbrance",
    title: "Takyidat",
    badge: "Kontrol",
    description:
      "Beyan, şerh, ipotek ve haciz kayıtları ham TAKBİS çıktısından rapora girecek temiz tabloya dönüştürülür.",
    fields: [
      { key: "takbisDate", label: "Takyidat tarihi", type: "date", critical: true, layoutClass: "encumbrance-date-field" },
      { key: "takbisTime", label: "Takyidat saati", type: "time", critical: true, layoutClass: "encumbrance-time-field" },
      { key: "takbisMethod", label: "Kayıt Kaynağı", type: "select", options: ["", "Webtapu Sistemi", "Tapu Müdürlüğü", "E-Devlet"], defaultValue: "Webtapu Sistemi", layoutClass: "encumbrance-method-field" },
      { key: "takbisSummary", label: "Takyidat açıklaması", type: "textarea", wide: true, layoutClass: "encumbrance-summary-field" },
    ],
    table: {
      title: "Rapora girecek takyidat kayıtları",
      columns: ["Tür", "Açıklama", "Tarih", "Yevmiye No"],
      rows: 5,
    },
  },
  {
    id: "planning",
    title: "İmar Durumu",
    badge: "Belediye",
    description:
      "Plan bilgileri, yapılaşma koşulları, terk/tevhid ve imar yorumları bankalara göre rapor metnine bağlanır.",
    fields: [
      { key: "imarInfoInstitution", label: "Bilgi alınan kurum", type: "text", critical: true },
      { key: "planScale", label: "Plan ölçeği", type: "select", options: imarPlanScaleOptions, critical: true },
      { key: "planDate", label: "Plan tarihi", type: "date" },
      { key: "planName", label: "İmar plan adı", type: "text", required: true, critical: true },
      { key: "legend", label: "İmar lejantı", type: "select", options: imarLegendOptions, critical: true },
      { key: "order", label: "İmar nizamı", type: "select", options: imarOrderOptions },
      { key: "floorCount", label: "Kat Adedi", type: "select", options: imarFloorCountOptions },
      { key: "hmax", label: "Hmax", type: "text" },
      { key: "taks", label: "TAKS", type: "text" },
      { key: "kaks", label: "KAKS / Emsal", type: "text" },
      { key: "calculatedEmsal", label: "Hesaplanan Emsal", type: "text" },
      { key: "frontGarden", label: "Ön bahçe", type: "text" },
      { key: "sideGarden", label: "Yan bahçe", type: "text" },
      { key: "hasPlanningIssue", label: "Taşınmazın İmar Durumunda Sorun Var mı?", type: "checkbox", checkedValue: "Evet", uncheckedValue: "Hayır", defaultValue: "Hayır", wide: true },
      { key: "planCancellationStay", label: "Plan İptali/Yürütmeyi Durdurma Kararı Var mı?", type: "conditionalYesNo", detailWhen: "Evet", detailKey: "planCancellationStayNote", hideInactiveDetail: true },
      { key: "roadSetback", label: "Yola terk var mı", type: "select", options: ["", "Evet", "Hayır"] },
      { key: "minimumFrontageCondition", label: "Minimum cephe şartı var mı?", type: "conditionalYesNo", detailWhen: "Evet", detailKey: "minimumFrontageConditionNote" },
      { key: "tevhidCondition", label: "Tevhid şartı var mı?", type: "conditionalYesNo", detailWhen: "Evet", detailKey: "tevhidConditionNote" },
      { key: "article18Applied", label: "18. Madde uygulaması yapılmış mı?", type: "conditionalYesNo", detailWhen: "Hayır", detailKey: "article18AppliedNote" },
      { key: "urbanTransformationArea", label: "Kentsel dönüşüm bölgesinde yer alıyor mu?", type: "conditionalYesNo", detailWhen: "Evet", detailKey: "urbanTransformationAreaNote" },
      { key: "licenseObstacle", label: "Ruhsatı almaya engel bir durum bulunuyor mu?", type: "conditionalYesNo", detailWhen: "Evet", detailKey: "licenseObstacleNote" },
      { key: "planRestrictionNote", label: "Plan Özel Notu / Kısıtlama Açıklama", type: "textarea" },
      { key: "planningNote", label: "İmar açıklaması", type: "textarea" },
    ],
  },
  {
    id: "documents",
    title: "Belgeler ve Proje",
    badge: "Resmi",
    description:
      "İncelenen belgeler, ruhsat/iskan, mimari proje ve uygunluk kararları raporun hukuki-teknik denetimini taşır.",
    fields: [
      { key: "hasArchitecturalProject", label: "Mimari Proje Var mı?", type: "checkbox", defaultValue: "Evet", checkedValue: "Evet", uncheckedValue: "Hayır", wide: true },
      { key: "projectRegisteredInCadastre", label: "Kadastroya işli mi?", type: "select", options: ["", "Evet", "Hayır"], wide: true },
      { key: "cadastralRegisteredBaseArea", label: "Kadastroya işli taban alanı", type: "number" },
      { key: "cadastralFootprintMatches", label: "Taban oturumu kadastral paftaya uygun mu?", type: "select", options: ["", "Evet", "Hayır"] },
      { key: "cadastralCorrectionFloorCount", label: "Cins tashihine esas kat sayısı", type: "select", options: ["", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
      {
        key: "projectInstitution",
        label: "Proje incelenen kurum",
        type: "multiCheckbox",
        critical: true,
        options: ["Webtapu", "Belediye", "OSB Bölge Müdürlüğü", "İl Özel İdare", "Büyükşehir Belediyesi", "Anıtlar Kurulu"],
      },
      { key: "documentReviewInstitution", label: "İnceleme yapılan kurum", type: "text", autoFill: true },
      { key: "projectDifference", label: "Tapu Projesi ve Belediye Projesi Arasında Fark Var mı?", type: "select", options: ["", "Evet", "Hayır"] },
      { key: "projectDate", label: "Proje tarihi", type: "date" },
      { key: "projectNo", label: "Proje no", type: "text" },
      { key: "projectType", label: "Proje türü", type: "select", options: ["", "Kat İrtifakı Projesi", "Tadilat Projesi", "Statik Projesi", "Restorasyon Projesi", "Restitüsyon Projesi", "Rölöve Projesi", "Avan Projesi"] },
      { key: "titleProjectDate", label: "Tapu Proje Tarihi", type: "date" },
      { key: "titleProjectNo", label: "Tapu Proje No", type: "text" },
      { key: "titleProjectType", label: "Tapu Proje Türü", type: "select", options: ["", "Kat İrtifakı Projesi", "Tadilat Projesi", "Statik Projesi", "Restorasyon Projesi", "Restitüsyon Projesi", "Rölöve Projesi", "Avan Projesi"] },
      { key: "municipalityProjectDate", label: "Belediye Proje Tarihi", type: "date" },
      { key: "municipalityProjectNo", label: "Belediye Proje No", type: "text" },
      { key: "municipalityProjectType", label: "Belediye Proje Türü", type: "select", options: ["", "Kat İrtifakı Projesi", "Tadilat Projesi", "Statik Projesi", "Restorasyon Projesi", "Restitüsyon Projesi", "Rölöve Projesi", "Avan Projesi"] },
      { key: "projectConformity", label: "Projeye uygunluk", type: "textarea", critical: true },
      { key: "reviewedDocumentsDescription", label: "İncelenen Belgeler Açıklaması", type: "textarea", wide: true },
      { key: "hasEkb", label: "Enerji Kimlik Belgesi", type: "select", options: ["", "Evet", "Hayır"], wide: true },
      { key: "ekbDocumentNo", label: "EKB belge no", type: "text" },
      { key: "ekbIssueDate", label: "EKB veriliş tarihi", type: "date" },
      { key: "ekbValidUntil", label: "EKB son geçerlilik tarihi", type: "date" },
      {
        key: "ekbEnergyClass",
        label: "Enerji performans sınıfı",
        type: "select",
        options: ["", "A", "B", "C", "D", "E", "F", "G"],
      },
      {
        key: "ekbEmissionClass",
        label: "Sera gazı emisyon sınıfı",
        type: "select",
        options: ["", "A", "B", "C", "D", "E", "F", "G"],
      },
    ],
    table: {
      title: "İncelenen belgeler",
      columns: ["Belge türü", "İncelenen kurum", "Tarih", "No", "Kapsam"],
      rows: 0,
    },
  },
  {
    id: "land",
    title: "Arsa Özellikleri",
    badge: "Fiziki",
    description:
      "Parselin yüzölçümü, geometrisi, topografyası, yol ilişkisi ve arsa kullanımına dair bilgiler burada tamamlanır.",
    fields: [
      { key: "landShape", label: "Arsanın geometrik şekli", type: "select", options: ["", "Dikdörtgen", "Kare", "Yamuk", "Amorf", "Üçgen", "Daire"] },
      { key: "landTopography", label: "Topografya / eğim", type: "select", options: ["", "Eğimsiz", "Az eğimli", "Çok eğimli"] },
      { key: "landRoadFrontage", label: "Kadastro/İmar Yoluna Cepheli mi?", type: "select", options: ["", "Evet", "Hayır"] },
      { key: "landAgricultureType", label: "Tarım Türü", type: "select", options: ["", "Sulu Tarım", "Kuru Tarım"] },
      { key: "landBoundaryElement", label: "Sınırları Belirleyici Unsur Var mı?", type: "select", options: ["", "Evet", "Hayır"] },
      { key: "landAgriculturalProduct", label: "Parsel üzerinde Zirai Ürün Var mı?", type: "select", options: ["", "Evet", "Hayır"] },
      { key: "landNote", label: "Arsa açıklaması", type: "textarea" },
    ],
  },
  {
    id: "building",
    title: "Ana Gayrimenkul Özellikleri",
    badge: "Fiziki",
    description:
      "Ana gayrimenkul, blok, kat adedi, yapı sınıfı, bağımsız bölüm alanları ve iç özellikler burada tamamlanır.",
    fields: [],
  },
  {
    id: "unit",
    title: "Bağımsız Bölüm Özellikleri",
    badge: "Fiziki",
    description:
      "Bağımsız bölümün yasal/mevcut kullanım alanları, iç özellikleri ve cephe bilgileri burada tamamlanır.",
    fields: [
      { key: "legalArea", label: "Yasal kullanım alanı", type: "text", required: true, critical: true, hidden: true },
      { key: "currentArea", label: "Mevcut kullanım alanı", type: "text", required: true, critical: true, hidden: true },
    ],
  },
  {
    id: "valuation",
    title: "Değerleme",
    badge: "Sonuç",
    description:
      "Yasal/mevcut değer, kira, risk notları, satış kabiliyeti ve değerleme açıklamaları bu bölümde hesaplanır ve kontrol edilir.",
    fields: [
      { key: "legalValue", label: "Yasal durum değeri", type: "number", required: true, critical: true },
      { key: "currentValue", label: "Mevcut durum değeri", type: "number", required: true, critical: true },
      { key: "currentRent", label: "Mevcut kira", type: "number" },
      { key: "legalRent", label: "Yasal kira", type: "number" },
      { key: "landUnitValue", label: "Arsa birim değeri", type: "number" },
      { key: "saleNote", label: "Satış açıklaması", type: "textarea", critical: true },
      { key: "riskCodes", label: "Risk kodları", type: "textarea" },
    ],
  },
  {
    id: "comparables",
    title: "Emsaller",
    badge: "Piyasa",
    description:
      "Emsaller satır bazlı girilir; sistem kısa metin, uzun metin ve banka tablosu çıktılarını buradan üretir.",
    fields: [
      { key: "marketSummary", label: "Piyasa özeti", type: "textarea" },
      { key: "adjustmentNote", label: "Düzeltme / şerefiye notu", type: "textarea" },
    ],
    table: {
      title: "Emsal kayıtları",
      columns: ["Kaynak", "Konum", "Alan", "Fiyat", "Düzeltme"],
      rows: 7,
    },
  },
  {
    id: "output",
    title: "Banka ve Çıktı",
    badge: "Üretim",
    description:
      "Eksik alan kontrolü, banka özel ekler, Word şablonu ve rapor üretim kayıtları bu bölümde toplanır.",
    fields: [
      { key: "templateProfile", label: "Şablon profili", type: "text", critical: true },
      { key: "outputFolder", label: "Çıktı klasörü", type: "text" },
      { key: "reportNote", label: "Rapor üretim notu", type: "textarea" },
    ],
  },
  {
    id: "placeholders",
    title: "Placeholder",
    badge: "Tanım",
    description:
      "Rapor şablonunda kullanılacak alanlar, otomatik oluşturulan metinler ve eski Excel adlandırılmış hücre karşılıkları burada izlenir.",
    fields: [],
  },
  {
    id: "explanations",
    title: "Açıklamalar",
    badge: "Açıklama",
    description:
      "Rapor genelinde seçilen koşullara göre kullanılacak ek açıklama metinleri burada toplanır. Hisseli mülkiyet, imar, takyidat, belge ve benzeri özel durum açıklamaları bu bölümden yönetilir.",
    fields: [
      { key: "shareExplanation", label: "Hisse Açıklaması", type: "textarea", wide: true },
      { key: "encumbranceExplanation", label: "Takyidat Açıklaması", type: "textarea", wide: true },
      { key: "planningExplanation", label: "İmar Açıklaması", type: "textarea", wide: true },
      { key: "documentExplanation", label: "Belge / Proje Açıklaması", type: "textarea", wide: true },
      { key: "generalExplanation", label: "Genel Açıklama", type: "textarea", wide: true },
    ],
  },
];

const workflow = [
  "İş dosyası açıldı",
  "Kaynak belgeler yüklendi",
  "Adres ve tapu kontrol edildi",
  "İmar ve belgeler tamamlandı",
  "Değerleme ve emsaller girildi",
  "Banka çıktısı üretime hazır",
];

const storageKey = "rapor-yazma-programi-draft-v1";
const userDefaultsStorageKey = `${storageKey}:user-defaults`;
const sourceGeneratedDefaultExcludedKeys = new Set([
  "titleOwnershipKind",
  "hasEkb",
  "ekbEnergyClass",
  "ekbEmissionClass",
  "planScale",
  "legend",
  "order",
  "floorCount",
  "roadSetback",
  "projectDifference",
]);
const nearbyRadiusMeters = 500;
const nearbyExpandedRadiusMeters = 1000;
const nearbyArteryFallbackRadiusMeters = 2000;
const nearbySettlementFallbackRadiusMeters = 2000;
const nearbyRequestTimeoutMs = 7000;
const nearbyResultLimit = 45;
const mainArteryAutoLimit = 4;
const nearbyAutoLimit = 6;
const nearbyCacheStorageKey = "rapor-yazma-programi-nearby-overpass-cache-v2";
const nearbyCacheTtlMs = 1000 * 60 * 60 * 24 * 30;
const nearbyCacheMaxEntries = 80;
const nearbyCategories = [
  { id: "government", label: "Devlet kurumları" },
  { id: "historic", label: "Tarihi yerler" },
  { id: "parks", label: "Parklar" },
  { id: "arteries", label: "Ana cadde ve bulvarlar" },
  { id: "junctions", label: "Kavşaklar" },
  { id: "metro", label: "Metro istasyonları" },
  { id: "education", label: "Eğitim kurumları" },
  { id: "health", label: "Sağlık tesisleri" },
  { id: "malls", label: "Alışveriş merkezleri" },
  { id: "coast", label: "Sahil / deniz" },
];
const importantNearbyCategories = new Set(["government", "historic", "parks", "junctions", "metro", "education", "health", "malls", "coast", "settlements"]);
const nearbyCategoryPriority = {
  arteries: 0,
  education: 1,
  metro: 2,
  junctions: 3,
  government: 4,
  health: 5,
  parks: 6,
  malls: 7,
  historic: 8,
  coast: 9,
  settlements: 10,
};
const encumbranceReportTables = [
  {
    key: "encumbranceDeclarations",
    title: "Beyanlar - Hak ve Mükellefiyetler",
  },
  {
    key: "encumbranceAnnotations",
    columns: ["Şerh Türü", "Açıklama", "Tarih", "Yevmiye No"],
    title: "Şerhler",
    columns: ["\u015eerh T\u00fcr\u00fc", "A\u00e7\u0131klama", "Haciz Tutar\u0131", "Tarih", "Yevmiye No"],
  },
  {
    key: "encumbranceMortgages",
    title: "İpotekler",
    columns: ["İpotek Lehdarı", "İpotek Derecesi", "İpotek Tutarı", "Tarih", "Yevmiye No"],
  },
];
const encumbranceReportColumns = ["Tür", "Açıklama", "Tarih", "Yevmiye No"];
const encumbranceEmptyRowCount = 3;
const mortgageCreditorBankNames = [
  "Türkiye Halk Bankası A.Ş.",
  "Türkiye Cumhuriyeti Ziraat Bankası A.Ş.",
  "Türkiye İş Bankası A.Ş.",
  "Türkiye Vakıflar Bankası T.A.O.",
  "Türkiye Garanti Bankası A.Ş.",
  "Akbank T.A.Ş.",
  "Yapı ve Kredi Bankası A.Ş.",
  "QNB Finansbank A.Ş.",
  "Denizbank A.Ş.",
  "ING Bank A.Ş.",
  "Türk Ekonomi Bankası A.Ş.",
  "Şekerbank T.A.Ş.",
  "Kuveyt Türk Katılım Bankası A.Ş.",
  "Türkiye Finans Katılım Bankası A.Ş.",
  "Vakıf Katılım Bankası A.Ş.",
  "Ziraat Katılım Bankası A.Ş.",
  "Emlak Katılım Bankası A.Ş.",
  "Albaraka Türk Katılım Bankası A.Ş.",
  "HSBC Bank A.Ş.",
  "Fibabanka A.Ş.",
  "Odea Bank A.Ş.",
  "Burgan Bank A.Ş.",
  "ICBC Turkey Bank A.Ş.",
  "Alternatifbank A.Ş.",
  "Anadolubank A.Ş.",
  "Arap Türk Bankası A.Ş.",
  "Birleşik Fon Bankası A.Ş.",
  "Deutsche Bank A.Ş.",
  "MUFG Bank Turkey A.Ş.",
  "BankPozitif Kredi ve Kalkınma Bankası A.Ş.",
  "Aktif Yatırım Bankası A.Ş.",
  "Diler Yatırım Bankası A.Ş.",
  "GSD Yatırım Bankası A.Ş.",
  "İller Bankası A.Ş.",
  "İstanbul Takas ve Saklama Bankası A.Ş.",
  "Türkiye Kalkınma ve Yatırım Bankası A.Ş.",
  "Türkiye Sınai Kalkınma Bankası A.Ş.",
  "Dünya Katılım Bankası A.Ş.",
];
let activeSectionId = sections[0].id;
let state = loadState();
normalizeAddressSourceState(state);
applySystemDefaults(state);
applyUserFieldDefaults(state);
let leafletMap = null;
let leafletKmlLayer = null;
let leafletSelectedMarker = null;
let nearbyAutoFetchStarted = false;
let nearbyRequestSerial = 0;
let localNeighborhoodDatabasePromise = null;
let localNeighborhoodRows = null;
let legacyPlaceholderRows = [];
let legacyPlaceholderRowsLoaded = false;
let legacyPlaceholderRowsLoading = false;

const localNeighborhoodDatabaseUrl = "server-data/bursa_manuel_duzeltilmis_ana_dosya.csv";
const legacyPlaceholderDefinitionsUrl = "server-data/adlandirilmis_hucreler_listesi.json";
const localNeighborhoodCoordinateOverrides = [
  {
    cityKey: "bursa",
    districtKey: "gursu",
    neighborhoodKey: "hasankoy",
    lat: 40.23761,
    lng: 29.19763,
  },
];

const documentTypeOptions = [
  "Yapı Kullanım İzin Belgesi",
  "Yeni Yapı Ruhsatı",
  "Tadilat Ruhsatı",
  "Yenileme Ruhsatı",
  "Yeniden Yapı Ruhsatı",
  "İlave Ruhsatı",
  "Kat İlavesi Ruhsatı",
  "Güçlendirme Ruhsatı",
  "Geçici Ruhsat",
  "Restorasyon Ruhsatı",
  "İsim Değişikliği Ruhsatı",
  "Kullanım Değişimi Ruhsatı",
  "Yapı Kayıt Belgesi",
];

const documentInstitutionStaticOptions = [
  "T.C. Çevre ve Şehircilik Bakanlığı",
];

const projectSuitabilityOptions = [
  "",
  "uygundur.",
  "blok bazında konum olarak uygun değildir.",
  "mimari olarak uygun değildir.",
  "kullanım alanı olarak uygun değildir.",
  "kullanım alanı ve mimari olarak uygun değildir.",
  "projeye uygunluk tespit edilmemiştir.",
  "Trampa",
  "Trampa ve Ayna Simetrisi",
  "Ayna Simetrisi (Konum Etkilenmiyor.)",
];

const sectionNav = document.querySelector("#sectionNav");
const bottomNav = document.querySelector("#bottomNav");
const sectionStage = document.querySelector("#sectionStage");
const workflowList = document.querySelector("#workflowList");
const validationList = document.querySelector("#validationList");
const documentQueue = document.querySelector("#documentQueue");
const caseTitle = document.querySelector("#caseTitle");
const caseCode = document.querySelector("#caseCode");
const bankStatus = document.querySelector("#bankStatus");
const missingCount = document.querySelector("#missingCount");
const lastSaved = document.querySelector("#lastSaved");
const syncLabel = document.querySelector("#syncLabel");
const syncDetail = document.querySelector("#syncDetail");
const syncDot = document.querySelector("#syncDot");
const fieldMode = document.querySelector("#fieldMode");

function loadState() {
  const savedUserDefaults = loadUserDefaults();
  const fallback = {
    fields: {
      caseName: "Yeni Ekspertiz Raporu",
      templateProfile: "Banka seçimine göre otomatik belirlenecek",
    },
    uploads: {},
    sourceValues: {},
    sourceConflicts: {},
    lookupOptions: {},
    settings: {
      mapMode: "hybrid",
      mapExportRatio: "4:3",
      mapExportLabels: true,
      userDefaults: savedUserDefaults,
    },
    tables: {},
    updatedAt: null,
  };

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const merged = {
      ...fallback,
      ...stored,
      fields: { ...fallback.fields, ...(stored.fields || {}) },
      uploads: { ...fallback.uploads, ...(stored.uploads || {}) },
      sourceValues: { ...fallback.sourceValues, ...(stored.sourceValues || {}) },
      sourceConflicts: { ...fallback.sourceConflicts, ...(stored.sourceConflicts || {}) },
      lookupOptions: { ...fallback.lookupOptions, ...(stored.lookupOptions || {}) },
      settings: {
        ...fallback.settings,
        ...(stored.settings || {}),
        userDefaults: {
          ...savedUserDefaults,
          ...((stored.settings || {}).userDefaults || {}),
        },
      },
      tables: { ...fallback.tables, ...(stored.tables || {}) },
    };
    merged.settings.mapMode = stored.settings?.mapMode ? normalizeMapMode(merged.settings.mapMode) : "hybrid";
    return merged;
  } catch {
    return fallback;
  }
}

function loadUserDefaults() {
  try {
    const stored = JSON.parse(localStorage.getItem(userDefaultsStorageKey) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveUserDefaults(defaults = state.settings?.userDefaults || {}) {
  localStorage.setItem(userDefaultsStorageKey, JSON.stringify(defaults || {}));
}

function normalizeAddressSourceState(appState) {
  const addressSource = appState.sourceValues?.address;
  if (!addressSource) return;

  const previousFields = addressSource.fields || {};
  const previousApplied = addressSource.applied || {};
  const parsedFields = addressSource.rawText ? parseAddressCodeText(addressSource.rawText) : previousFields;
  addressSource.fields = {
    ...previousFields,
    ...parsedFields,
    addressSiteName: cleanAddressTableName(parsedFields.addressSiteName || previousFields.addressSiteName || ""),
    addressBlockName: "",
    blockName: "",
  };
  addressSource.applied = previousApplied;

  const siteValue = addressSource.fields.addressSiteName || "";
  const currentSiteValue = appState.fields.addressSiteName || "";
  const oldSiteSourceValues = [previousApplied.addressSiteName, previousFields.addressSiteName].filter(Boolean);
  if (siteValue && (!currentSiteValue || oldSiteSourceValues.includes(currentSiteValue))) {
    appState.fields.addressSiteName = siteValue;
    addressSource.applied.addressSiteName = siteValue;
  }
  if (currentSiteValue && oldSiteSourceValues.includes(currentSiteValue) && !siteValue) {
    appState.fields.addressSiteName = "";
    delete addressSource.applied.addressSiteName;
  }

  clearRetiredAddressSourceFields(addressSource.fields, previousApplied, appState, previousFields);
}

function isFixedHolidayTR(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;

  return (
    (month === 1 && day === 1) ||
    (month === 4 && day === 23) ||
    (month === 5 && (day === 1 || day === 19)) ||
    (month === 7 && day === 15) ||
    (month === 8 && day === 30) ||
    (month === 10 && day === 29)
  );
}

function getLastBusinessDay(date = new Date()) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  while (target.getDay() === 0 || target.getDay() === 6 || isFixedHolidayTR(target)) {
    target.setDate(target.getDate() - 1);
  }

  return target;
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTRDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

function applyDefaultPlanningIssueValues(fields = {}) {
  if (normalizeYesNoChoice(fields.hasPlanningIssue) === "Evet") return false;
  const defaults = {
    hasPlanningIssue: "Hayır",
    planCancellationStay: "Hayır",
    roadSetback: "Hayır",
    minimumFrontageCondition: "Hayır",
    tevhidCondition: "Hayır",
    article18Applied: "Evet",
    urbanTransformationArea: "Hayır",
    licenseObstacle: "Hayır",
  };
  let changed = false;
  Object.entries(defaults).forEach(([key, value]) => {
    if (fields[key] !== value) {
      fields[key] = value;
      changed = true;
    }
  });
  if (fields.roadSetbackAmount || fields.roadSetbackBuildingImpact) {
    fields.roadSetbackAmount = "";
    fields.roadSetbackBuildingImpact = "";
    changed = true;
  }
  return changed;
}

function applySystemDefaults(targetState) {
  const businessDate = toISODate(getLastBusinessDay());
  targetState.system = {
    ...(targetState.system || {}),
    businessDate,
    businessDateLabel: formatTRDate(businessDate),
  };

  if (!targetState.fields.appointmentDate) {
    targetState.fields.appointmentDate = businessDate;
  }

  if (!targetState.fields.municipalityInspectionDate) {
    targetState.fields.municipalityInspectionDate = targetState.fields.appointmentDate;
  }

  if (!targetState.fields.planCancellationStay) {
    targetState.fields.planCancellationStay = "Hayır";
  }

  if (!targetState.fields.hasPlanningIssue) {
    targetState.fields.hasPlanningIssue = "Hayır";
  }
  applyDefaultPlanningIssueValues(targetState.fields);

  if (!targetState.fields.penaltyDecision) {
    targetState.fields.penaltyDecision = targetState.fields.penaltyNote ? "Evet" : "Hayır";
  }

  if (!["Webtapu Sistemi", "Tapu Müdürlüğü", "E-Devlet"].includes(targetState.fields.takbisMethod)) {
    targetState.fields.takbisMethod = "Webtapu Sistemi";
  }

  syncEkbPresenceField(targetState);
}

function syncEkbPresenceField(targetState) {
  const hasUploadedEkb = Boolean(targetState.uploads?.ekb || targetState.sourceValues?.ekb?.rawText);
  if (hasUploadedEkb) {
    targetState.fields.hasEkb = "Evet";
    return;
  }
  targetState.fields.hasEkb = normalizeYesNoChoice(targetState.fields.hasEkb);
}

function applyImarDerivedBusinessRules(targetState) {
  const fields = targetState.fields || {};
  let changed = false;

  if (applyDefaultPlanningIssueValues(fields)) {
    changed = true;
  }

  if (fields.planRestrictionNote) {
    const cleanPlanRestrictionNote = cleanImarPlanRestrictionNote(fields.planRestrictionNote);
    if (cleanPlanRestrictionNote !== fields.planRestrictionNote) {
      fields.planRestrictionNote = cleanPlanRestrictionNote;
      changed = true;
    }
  }

  getConditionalYesNoPlanningFields().forEach((field) => {
    const normalizedValue = normalizeYesNoChoice(fields[field.key]);
    if (fields[field.key] && fields[field.key] !== normalizedValue) {
      fields[field.key] = normalizedValue;
      changed = true;
    }
    if (!shouldOpenConditionalDetail(field, normalizedValue) && fields[field.detailKey]) {
      fields[field.detailKey] = "";
      changed = true;
    }
  });

  const normalizedRoadSetback = normalizeYesNoChoice(fields.roadSetback);
  if (fields.roadSetback && fields.roadSetback !== normalizedRoadSetback) {
    fields.roadSetback = normalizedRoadSetback;
    changed = true;
  }

  if (fields.roadSetback !== "Evet" && (fields.roadSetbackAmount || fields.roadSetbackBuildingImpact)) {
    fields.roadSetbackAmount = "";
    fields.roadSetbackBuildingImpact = "";
    changed = true;
  }

  if (String(fields.kaks || "").trim() && fields.order !== "Ayrık") {
    fields.order = "Ayrık";
    changed = true;
  }

  const calculatedKatAdedi = calculateImarKatFromHeight(fields.hmax);
  if (calculatedKatAdedi && fields.floorCount !== calculatedKatAdedi) {
    fields.floorCount = calculatedKatAdedi;
    changed = true;
  }

  if (!fields.hmax && fields.floorCount) {
    const katAdedi = Number(String(fields.floorCount).replace(",", "."));
    if (Number.isFinite(katAdedi) && katAdedi > 0) {
      fields.hmax = `${(katAdedi * 3 + 0.5).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
      changed = true;
    }
  }

  return changed;
}

function saveState() {
  applySystemDefaults(state);
  applyUserFieldDefaults(state);
  applyImarDerivedBusinessRules(state);
  normalizeReportStateFields(state);
  state.updatedAt = new Date().toISOString();
  saveUserDefaults(state.settings?.userDefaults || {});
  localStorage.setItem(storageKey, JSON.stringify(state));
  updateStatus();
}

function debounce(fn, wait = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

const autosave = debounce(() => {
  setSyncState("Kaydediliyor", "Bu cihazdaki taslak güncelleniyor.", "pending");
  saveState();
  setTimeout(() => setSyncState("Kaydedildi", "Bu cihazdaki taslak güncel.", "saved"), 250);
}, 450);

const fetchAddressLookupDebounced = debounce(() => {
  fetchAddressLookupForCurrentLocation({ silent: true }).then(() => {
    autosave();
    if (activeSectionId === "address") {
      renderSection();
    }
  });
}, 900);

const applyPostalCodeFromNeighborhoodDebounced = debounce(() => {
  applyPostalCodeFromSelectedNeighborhood({ silent: true }).then((changed) => {
    if (!changed) return;
    autosave();
    if (activeSectionId === "address") renderSection();
    renderValidation();
    updateStatus();
  }).catch(() => {});
}, 450);

function setSyncState(label, detail, mode) {
  syncLabel.textContent = label;
  syncDetail.textContent = detail;
  syncDot.style.background = mode === "pending" ? "#e0a02d" : "#79d29f";
}

function createNav() {
  sectionNav.innerHTML = "";
  bottomNav.innerHTML = "";

  sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-button";
    button.dataset.section = section.id;
    button.innerHTML = `
      <span class="nav-index">${index + 1}</span>
      <span class="nav-title">${formatUiHeading(section.title)}</span>
      <span class="nav-badge">${section.badge}</span>
    `;
    button.addEventListener("click", () => setActiveSection(section.id));
    sectionNav.append(button);
  });

  sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.section = section.id;
    button.innerHTML = `
      <span class="bottom-nav-index">${index + 1}</span>
      <span class="bottom-nav-title">${formatMobileNavTitle(section.title)}</span>
    `;
    button.addEventListener("click", () => setActiveSection(section.id));
    bottomNav.append(button);
  });
}

function formatMobileNavTitle(title) {
  const shortcuts = new Map([
    ["Dosya ve Rapor", "Dosya"],
    ["Adres ve Konum", "Adres"],
    ["Tapu ve Mülkiyet", "Tapu"],
    ["Takyidat", "Takyidat"],
    ["İmar Durumu", "İmar"],
    ["Belgeler ve Proje", "Belge"],
    ["Arsa Özellikleri", "Arsa"],
    ["Ana Gayrimenkul Özellikleri", "Ana"],
    ["Bağımsız Bölüm Özellikleri", "BB"],
    ["Değerleme", "Değer"],
    ["Emsaller", "Emsal"],
    ["Banka ve Çıktı", "Çıktı"],
  ]);
  return formatUiHeading(shortcuts.get(title) || title.split(" ")[0]);
}

function setActiveSection(id) {
  activeSectionId = id;
  render();
  if (window.matchMedia("(max-width: 820px)").matches) {
    requestAnimationFrame(() => {
      const target = document.querySelector(".section-card");
      const topOffset = document.querySelector(".topbar")?.offsetHeight || 0;
      const top = Math.max(0, (target?.getBoundingClientRect().top || 0) + window.scrollY - topOffset - 8);
      window.scrollTo({ top, behavior: "smooth" });
      document.querySelector(`#bottomNav [data-section="${id}"]`)?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
  }
}

function render() {
  document.body.classList.toggle("field-mode", fieldMode.checked);
  renderNavState();
  renderSection();
  renderWorkflow();
  renderDocuments();
  renderValidation();
  updateStatus();
  maybeAutoFetchNearbyPlaces();
}

function renderNavState() {
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.section === activeSectionId);
  });
}

function renderSection() {
  const section = sections.find((item) => item.id === activeSectionId);
  const card = document.createElement("article");
  card.className = `section-card section-${section.id}`;

  card.innerHTML = `
    <header class="section-head">
      <div>
        <h3>${formatUiHeading(section.title)}</h3>
        <p>${section.description}</p>
      </div>
      <span class="section-pill">${section.badge}</span>
    </header>
    <div class="section-body"></div>
  `;

  const body = card.querySelector(".section-body");

  if (section.uploads && section.id !== "case") {
    body.append(createUploadGrid(section.uploads));
  }

  if (section.id === "documents") {
    ensureDocumentReviewInstitutionDefault();
  }

  if (section.id === "placeholders") {
    body.append(createPlaceholderDefinitionsPanel());
  }

  if (section.id === "explanations") {
    refreshShareExplanationFromCurrentFields("titleOwnershipKind");
  }

  if ((section.fields || []).length && section.id !== "unit") {
    body.append(createForm(section));
  }

  if (section.uploads && section.id === "case") {
    body.append(createUploadGrid(section.uploads));
  }

  if (section.id === "address") {
    body.append(createAddressSourceSummary());
    body.append(createLocationMapTools());
  }

  if (section.id === "title") {
    body.append(createTakbisTitleSummary());
  }

  if (section.id === "documents" && shouldShowArchitecturalProjectFields()) {
    body.append(createEkbSourceSummary());
    body.append(createDocumentDecisionControls());
  }

  if (section.id === "planning") {
    body.append(createImarSourceSummary());
  }

  if (section.id === "building") {
    body.append(createBuildingFloorDistribution());
  }

  if (section.id === "unit") {
    body.append(createUnitFeaturesEditor());
  }

  if (section.id === "encumbrance") {
    body.append(createTakbisEncumbranceSourceSummary());
    body.append(createEncumbranceReportTables());
  } else if (section.id === "comparables") {
    body.append(createComparablesVerticalEditor(section));
  } else if (section.table) {
    body.append(createTable(section));
  }

  sectionStage.replaceChildren(card);
}

function createForm(section) {
  const form = document.createElement("div");
  form.className = "form-grid";

  section.fields.forEach((field) => {
    if (field.hidden || shouldHideField(section.id, field.key)) return;

    if (section.id === "address" && ["latitude", "longitude"].includes(field.key)) {
      return;
    }

    if (section.id === "documents" && isProjectDetailFieldKey(field.key)) {
      if (field.key === "projectType" || field.key === "titleProjectType") {
        form.append(createProjectDetailsGrid(section));
      }
      return;
    }

    if (section.id === "documents" && field.key === "projectConformity") {
      form.append(createProjectSuitabilityControl());
      return;
    }

    if (section.id === "address" && field.key === "mainArtery") {
      return;
    }

    if (section.id === "address" && field.key === "transport") {
      form.append(createTransportNearbyComposer(field, section.fields.find((item) => item.key === "nearby")));
      return;
    }

    if (section.id === "address" && field.key === "nearby") {
      return;
    }

    if (section.id === "land" && field.key === "landRoadFrontage") {
      form.append(createLandRoadFrontageControl(field));
      return;
    }

    if (section.id === "land" && field.key === "landAgricultureType") {
      form.append(createLandAgricultureTypeControl(field));
      return;
    }

    if (section.id === "land" && field.key === "landBoundaryElement") {
      form.append(createLandBoundaryElementControl(field));
      return;
    }

    if (section.id === "land" && field.key === "landAgriculturalProduct") {
      form.append(createLandAgriculturalProductControl(field));
      return;
    }

    if (section.id === "case" && field.key === "appointmentType") {
      form.append(createAppointmentTypeControl(field));
      return;
    }

    if (section.id === "planning" && isPlanningIssueDetailField(field.key) && !shouldShowPlanningIssueFields()) {
      return;
    }

    if (section.id === "planning" && field.key === "floorCount") {
      form.append(createFloorHmaxPairControl());
      return;
    }

    if (section.id === "planning" && field.key === "hmax") {
      return;
    }

    if (section.id === "planning" && field.key === "frontGarden") {
      form.append(createGardenSetbacksPairControl());
      return;
    }

    if (section.id === "planning" && field.key === "sideGarden") {
      return;
    }

    if (section.id === "planning" && field.key === "roadSetback") {
      return;
    }

    if (field.type === "titleRecordChange") {
      form.append(createTitleRecordChangeControl(field));
      return;
    }

    if (field.type === "conditionalYesNo") {
      form.append(createConditionalYesNoControl(field));
      return;
    }

    if (field.type === "multiCheckbox") {
      form.append(createMultiCheckboxControl(field));
      return;
    }

    if (field.type === "checkbox") {
      form.append(createCheckboxControl(section, field));
      return;
    }

    const label = document.createElement("label");
    label.className = "field";
    if (field.layoutClass) label.classList.add(field.layoutClass);
    label.classList.toggle("is-required", Boolean(field.required));
    label.classList.toggle("is-critical", Boolean(field.critical));
    label.classList.toggle("field-wide", Boolean(field.wide));

    const effectiveDefaultValue = getEffectiveDefaultValueForField(field);
    let value = state.fields[field.key] || effectiveDefaultValue || "";
    if (!state.fields[field.key] && effectiveDefaultValue && !isFieldKeyOwnedBySource(field.key)) {
      state.fields[field.key] = effectiveDefaultValue;
    }
    if (
      field.key === "takbisSummary"
      && (/Bila üzerinden alınan TA(KBİS|KBIS)/i.test(value) || /Beyanlar - Hak ve Mükellefiyetler Bölümü/i.test(value) || /\b(?:T|A)\.a\./.test(value))
    ) {
      state.fields.takbisSummary = buildEncumbranceSummary();
      value = state.fields.takbisSummary;
    }
    if (field.key === "environmentDescription" && (!value || /\{\{[^}]+\}\}/.test(value))) {
      state.fields.environmentDescription = buildEnvironmentalDescription();
      value = state.fields.environmentDescription;
    }
    let control;

    if (field.type === "select") {
      control = document.createElement("select");
      const options = [...(field.options || [])];
      if (value && !options.includes(value)) {
        options.push(value);
      }
      options.forEach((option) => {
        const item = document.createElement("option");
        item.value = option;
        item.textContent = option || "Seçiniz";
        control.append(item);
      });
      control.value = value;
    } else if (field.type === "textarea") {
      control = document.createElement("textarea");
      control.value = value;
    } else {
      control = document.createElement("input");
      control.type = field.type;
      control.value = value;
      const lookupValues = getLookupValuesForField(field.key);
      if (lookupValues.length || field.lookup || ["city", "district", "neighborhood", "postalCode"].includes(field.key)) {
        const listId = `lookup-${field.key}`;
        control.setAttribute("list", listId);
        control.autocomplete = "off";
        form.append(createLookupDatalist(listId, lookupValues));
      }
    }

    control.dataset.field = field.key;

    markFieldSourceState(control, field.key, field.autoFill);

    control.addEventListener("input", (event) => {
      clearFieldSourceOwnership(field.key);
      state.fields[field.key] = event.target.value;
      if (field.key === "caseName") caseTitle.textContent = event.target.value || "Yeni Ekspertiz Raporu";
      refreshPlanningNoteFromCurrentFields(field.key);
      refreshEnvironmentDescriptionFromCurrentFields(field.key);
      refreshReviewedDocumentsDescriptionFromCurrentFields(field.key);
      refreshEncumbranceSummaryFromCurrentFields(field.key);
      refreshMainPropertyDescriptionFromCurrentFields(field.key);
      refreshShareExplanationFromCurrentFields(field.key);
      autosave();
      renderValidation();
      updateStatus();
      if (section.id === "title" && field.key === "groundType") renderSection();
      if (section.id === "address" && field.key === "environmentRegionType") {
        normalizeRegionUsePurposeForEnvironment();
        refreshEnvironmentDescriptionFromCurrentFields("regionUsePurpose");
        renderSection();
      }
      if (section.id === "documents" && field.key === "hasEkb") renderSection();
      if (section.id === "documents" && field.key === "projectDifference") renderSection();
      if (section.id === "documents" && field.key === "projectRegisteredInCadastre") renderSection();
      if (section.id === "address" && ["city", "district", "neighborhood"].includes(field.key)) {
        applyPostalCodeFromNeighborhoodDebounced();
      }
    });
    control.addEventListener("blur", () => {
      const formattedValue = normalizeReportFieldValue(field.key, control.value);
      if (formattedValue === control.value) return;
      control.value = formattedValue;
      state.fields[field.key] = formattedValue;
      if (field.key === "caseName") caseTitle.textContent = formattedValue || "Yeni Ekspertiz Raporu";
      refreshPlanningNoteFromCurrentFields(field.key);
      refreshEnvironmentDescriptionFromCurrentFields(field.key);
      refreshReviewedDocumentsDescriptionFromCurrentFields(field.key);
      refreshEncumbranceSummaryFromCurrentFields(field.key);
      refreshMainPropertyDescriptionFromCurrentFields(field.key);
      refreshShareExplanationFromCurrentFields(field.key);
      autosave();
      renderValidation();
      updateStatus();
    });

    label.append(createSpan(getFieldDisplayLabel(section.id, field)), control);
    if (section.id === "planning" && field.key === "planningNote") {
      label.append(createPlanningNoteRefreshActions());
    }
    if (field.note) label.append(createHint(field.note));
    label.classList.toggle("is-missing", field.required && !value);
    form.append(label);
  });

  return form;
}

function createPlanningNoteRefreshActions() {
  const actions = document.createElement("div");
  actions.className = "unit-decorative-actions";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary-button";
  button.textContent = "İmar açıklamasını yenile";
  button.addEventListener("click", () => {
    state.fields.planningNote = buildImarPlanningNote();
    autosave();
    renderSection();
    renderValidation();
    updateStatus();
  });
  actions.append(button);
  return actions;
}

const planningNoteAutoRefreshFields = new Set([
  "bank",
  "landArea",
  "municipalityInspectionDate",
  "imarInfoInstitution",
  "hasPlanningIssue",
  "planCancellationStay",
  "planCancellationStayNote",
  "planScale",
  "planDate",
  "planName",
  "legend",
  "order",
  "floorCount",
  "hmax",
  "taks",
  "kaks",
  "frontGarden",
  "sideGarden",
  "roadSetback",
  "roadSetbackAmount",
  "roadSetbackBuildingImpact",
  "minimumFrontageCondition",
  "minimumFrontageConditionNote",
  "tevhidCondition",
  "tevhidConditionNote",
  "article18Applied",
  "article18AppliedNote",
  "urbanTransformationArea",
  "urbanTransformationAreaNote",
  "licenseObstacle",
  "licenseObstacleNote",
  "planRestrictionNote",
]);

function refreshPlanningNoteFromCurrentFields(changedKey = "") {
  if (!planningNoteAutoRefreshFields.has(changedKey)) return;
  const nextNote = buildImarPlanningNote();
  const nextCalculatedEmsal = buildImarCalculatedEmsal();
  state.fields.planningNote = nextNote;
  state.fields.calculatedEmsal = nextCalculatedEmsal;
  const planningNoteControl = document.querySelector('[data-field="planningNote"]');
  if (planningNoteControl && planningNoteControl.value !== nextNote) {
    planningNoteControl.value = nextNote;
  }
  const calculatedEmsalControl = document.querySelector('[data-field="calculatedEmsal"]');
  if (calculatedEmsalControl && calculatedEmsalControl.value !== nextCalculatedEmsal) {
    calculatedEmsalControl.value = nextCalculatedEmsal;
  }
}

const environmentDescriptionAutoRefreshFields = new Set([
  "city",
  "district",
  "neighborhood",
  "boundNeighborhood",
  "boundNeighborhoodDistance",
  "districtCenterDistance",
  "cityCenterDistance",
  "addressSiteName",
  "addressBlockName",
  "addressFloor",
  "mainArtery",
  "mainArteryProximity",
  "nearby",
  "regionBuildOrder",
  "regionFloorRange",
  "regionIncomeLevel",
  "infrastructureLevel",
  "developmentSpeed",
  "regionBuildingAge",
  "developmentDensity",
  "socialNeeds",
  "regionUsePurpose",
  "planningPrincipleHarmony",
  "agriculturalActivityDensity",
  "agriculturalActivityTypes",
  "agriculturalSuitability",
  "commercialFunctionDensity",
  "commercialFirmType",
  "commercialFrontageRoadType",
  "commercialDevelopmentCompleted",
  "blockNo",
  "parcelNo",
  "titleBlockName",
  "titleFloor",
  "unitNo",
  "environmentRegionType",
]);

function refreshEnvironmentDescriptionFromCurrentFields(changedKey = "") {
  if (!environmentDescriptionAutoRefreshFields.has(changedKey)) return;
  const nextDescription = buildEnvironmentalDescription();
  state.fields.environmentDescription = nextDescription;
  const control = document.querySelector('[data-field="environmentDescription"]');
  if (control && control.value !== nextDescription) {
    control.value = nextDescription;
  }
}

function readEnvironmentalField(primaryKey, token, options = {}) {
  if (options.usePlaceholderTokens) return `{{${token}}}`;
  const keys = [primaryKey, ...(options.fallbackKeys || [])];
  const rawValue = keys.map((key) => state.fields?.[key]).find((value) => String(value || "").trim());
  const value = String(rawValue || "").trim();
  if (value) return value;
  return options.fallbackToToken ? `{{${token}}}` : "";
}

function detectEnvironmentalRegionType(regionType = "") {
  const explicit = String(regionType || "").toLocaleLowerCase("tr-TR");
  if (explicit.includes("tarımsal") || explicit.includes("tarım")) return "Tarımsal Alan";
  if (explicit.includes("sanayi")) return "Sanayi Bölgesi";
  if (explicit.includes("ticaret")) return "Ticaret Bölgesi";
  if (explicit.includes("konut")) return "Konut Bölgesi";
  const haystack = [
    state.fields?.regionUsePurpose,
    state.fields?.legend,
    state.fields?.planningLegend,
    state.fields?.unitType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");
  if (/(tarım|tarla|bağ|bahçe|zeytin|meyve)/i.test(haystack)) return "Tarımsal Alan";
  if (/(sanayi|depolama|lojistik)/i.test(haystack)) return "Sanayi Bölgesi";
  if (/(ticaret|işyeri|ofis|merkezi iş)/i.test(haystack)) return "Ticaret Bölgesi";
  return "Konut Bölgesi";
}

function formatEnvironmentalFloorPhrase(value) {
  const floor = String(value || "").trim();
  if (!floor) return "";
  if (/^\d+$/.test(floor)) return `${floor}. Kat`;
  return /\bkat(?:ı)?$/i.test(floor) ? floor : `${floor} Kat`;
}

function formatEnvironmentalBuildingPhrase(siteName, blockName) {
  const block = String(blockName || "").trim();
  const site = String(siteName || "").trim();
  if (!site && !block) return "";
  const blockPhrase = block ? (/\bblok$/i.test(block) ? block : `${block} Blok`) : "";
  if (!site) return blockPhrase;
  const foldedSite = foldTurkish(site);
  const isApartment = /APARTMAN|APARTMANI/.test(foldedSite);
  const isSite = /SITE|SITESI/.test(foldedSite);
  const sitePhrase =
    !isApartment && (blockPhrase || isSite)
      ? site.replace(/\bsite(?:si)?$/i, "").trim().replace(/\s+/g, " ") + " Sitesi"
      : site;
  return [sitePhrase, blockPhrase].filter(Boolean).join(", ");
}

function formatEnvironmentalUnitDescriptor(values) {
  const buildingPhrase = formatEnvironmentalBuildingPhrase(values.siteName, values.blockName);
  const floorPhrase = formatEnvironmentalFloorPhrase(values.floor);
  return [buildingPhrase, floorPhrase, values.unitNo ? `${values.unitNo} no.lu bağımsız bölüm` : ""]
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatEnvironmentalPlaceholderDescriptor(values) {
  return [values.siteName, values.blockName, values.floor, values.unitNo ? `${values.unitNo} no.lu bağımsız bölüm` : ""]
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();
}

function appendEnvironmentalIntroProximity(baseText, values) {
  return `${baseText} olup bölgenin ana arterlerine ${values.mainArteryProximity} mesafede yer almaktadır.`;
}

function normalizeReportNumberFormats(value) {
  return String(value || "").replace(
    /(^|[^\d])(\d{1,12})\.(\d{1,2})(?!\d)/g,
    (match, prefix, integerPart, decimalPart, offset, input) => {
      const nextChar = input.charAt(offset + match.length);
      if (nextChar === "." || nextChar === "/") return match;
      const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `${prefix}${groupedInteger},${decimalPart}`;
    }
  );
}

function buildEnvironmentalIntro(values, options = {}) {
  const baseLocation =
    `Ekspertize konu taşınmaz, ${values.city} ili, ${values.district} ilçesi, ${values.neighborhood} mahallesinde, ` +
    `${values.blockNo} ada, ${values.parcelNo} parsel üzerinde`;

  if (options.usePlaceholderTokens) {
    const descriptor = formatEnvironmentalPlaceholderDescriptor(values);
    const intro = descriptor ? `${baseLocation} konumlu ${descriptor}` : `${baseLocation} konumlu`;
    return appendEnvironmentalIntroProximity(intro, values);
  }

  if (!values.unitNo) {
    return `${baseLocation} konumludur.`;
  }

  const unitParts = formatEnvironmentalUnitDescriptor(values);
  return appendEnvironmentalIntroProximity(`${baseLocation} konumlu ${unitParts}`, values);
}

function formatEnvironmentalList(value) {
  const text = String(value || "").trim();
  if (!text || /\{\{[^}]+\}\}/.test(text)) return text;
  return formatTurkishList(
    text
      .split(/\s*,\s*|\s+ve\s+/i)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function buildCommercialFunctionSentence(values, options = {}) {
  if (options.usePlaceholderTokens) {
    return `Taşınmazın bulunduğu bölge, ticari fonksiyonların ${values.commercialFunctionDensity} düzeyde geliştiği, ${values.commercialFrontageRoadType} etkisindeki bir konumda yer almaktadır. Bölgedeki yapılaşmanın tamamlanma durumu ${values.commercialDevelopmentCompleted} olarak değerlendirilmiştir. `;
  }

  const density = String(values.commercialFunctionDensity || "Yoğun").trim();
  const densityKey = density.toLocaleLowerCase("tr-TR");
  const roadType = String(values.commercialFrontageRoadType || "Taşıt Yolu").trim();
  const isCompleted = normalizeYesNoChoice(values.commercialDevelopmentCompleted || "Evet") === "Evet";
  const densityPhrase = densityKey === "orta yoğun" ? "orta yoğunlukta" : `${densityKey} olarak`;
  const movementPhrase = densityKey === "seyrek" ? "sınırlı" : densityKey === "orta yoğun" ? "orta yoğunlukta" : "yüksek";
  const movementSource = roadType === "Yaya Yolu" ? "yaya sirkülasyonunun" : "araç ve yaya sirkülasyonunun";
  const effectSentence =
    densityKey === "seyrek"
      ? "Ticari hareketliliğin seyrek olması, görünürlük ve erişilebilirlik açısından dezavantaj oluşturmaktadır."
      : densityKey === "orta yoğun"
        ? "Ticari hareketliliğin orta yoğunlukta olması, görünürlük ve erişilebilirlik açısından dengeli bir konum avantajı sağlamaktadır."
        : "Ticari hareketliliğin yoğun olması, görünürlük ve erişilebilirlik açısından avantaj sağlamaktadır.";
  const completionSentence = isCompleted
    ? "Bölge genelinde yapılaşma tamamlanmış olup, taşınmazın konumu ticari kullanım ve yatırım açısından olumlu nitelik taşımaktadır."
    : "Bölge genelinde yapılaşma tamamlanmamış olup, taşınmazın konumu ticari kullanım ve yatırım açısından standart seviyededir.";

  return `Taşınmazın bulunduğu bölge, ticari fonksiyonların ${densityPhrase} geliştiği, ${movementSource} ${movementPhrase} olduğu bir konumda yer almaktadır. ${effectSentence} ${completionSentence} `;
}

function buildIndustrialUsePurposeText(value, options = {}) {
  const text = String(value || "").trim();
  if (options.usePlaceholderTokens) return text || "{{BÖLGE.YAP.KUL.AMACI}}";
  if (!text) return "sanayi tesisleri";
  return formatEnvironmentalList(text).toLocaleLowerCase("tr-TR");
}

function buildAgriculturalActivityText(value, options = {}) {
  const text = String(value || "").trim();
  if (options.usePlaceholderTokens) return text || "{{TARIMSAL.FAALİYET.TÜRÜ}}";
  if (!text) return "bitkisel üretim, hayvancılık ve tarıma dayalı kullanım";
  return formatEnvironmentalList(text).toLocaleLowerCase("tr-TR");
}

function cleanBoundNeighborhoodCenterName(value = "") {
  const baseName = String(value || "")
    .split(/\s*-\s*|\s*\/\s*/)[0]
    .replace(/\b(mahallesi|mahalle|mah\.?|köyü|köy)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return baseName ? `${baseName} Mahalle Merkezinin` : "";
}

function cleanEnvironmentalDistancePhrase(value = "") {
  return String(value || "")
    .replace(/^taşınmaz\s+(?:mahalle|köy|ilçe|il)\s+merkezinin\s+/i, "")
    .replace(/^taşınmaz\s+/i, "")
    .replace(/^merkezinin\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAgriculturalKmlDistanceSentence(values, options = {}) {
  if (options.usePlaceholderTokens) {
    return `KML koordinat verisine göre taşınmaz, bağlı bulunduğu ${values.boundNeighborhood} mahalle/köy merkezinin ${values.boundNeighborhoodDistance}, ${values.district} ilçe merkezinin ${values.districtCenterDistance}, ${values.city} il merkezinin ${values.cityCenterDistance} konumunda yer almaktadır. `;
  }
  const parts = [];
  const boundCenterName = cleanBoundNeighborhoodCenterName(values.boundNeighborhood);
  const boundDistance = cleanEnvironmentalDistancePhrase(values.boundNeighborhoodDistance);
  const districtDistance = cleanEnvironmentalDistancePhrase(values.districtCenterDistance);
  const cityDistance = cleanEnvironmentalDistancePhrase(values.cityCenterDistance);
  if (boundCenterName && boundDistance) {
    parts.push(`bağlı bulunduğu ${boundCenterName} ${boundDistance}`);
  }
  if (values.district && districtDistance) {
    parts.push(`${values.district} ilçe merkezinin ${districtDistance}`);
  }
  if (values.city && cityDistance) {
    parts.push(`${values.city} il merkezinin ${cityDistance}`);
  }
  if (!parts.length) return "";
  return `KML koordinat verisine göre taşınmaz, ${formatTurkishList(parts)} yer almaktadır. `;
}

function buildEnvironmentalDescription(regionType = state.fields?.environmentRegionType || "", options = {}) {
  const usePlaceholderTokens = Boolean(options.usePlaceholderTokens);
  const values = {
    city: readEnvironmentalField("city", "SEHIR", { usePlaceholderTokens }),
    district: readEnvironmentalField("district", "ILCE", { usePlaceholderTokens }),
    neighborhood: readEnvironmentalField("neighborhood", "İDARİMAHALLE", { usePlaceholderTokens }),
    blockNo: readEnvironmentalField("blockNo", "Ada", { usePlaceholderTokens }),
    parcelNo: readEnvironmentalField("parcelNo", "Parsel", { usePlaceholderTokens }),
    boundNeighborhood: readEnvironmentalField("boundNeighborhood", "BAĞLI.MAHALLE.KÖY", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }),
    boundNeighborhoodDistance: readEnvironmentalField("boundNeighborhoodDistance", "BAĞLI.MAHALLE.MERKEZİ.MESAFESİ", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }),
    districtCenterDistance: readEnvironmentalField("districtCenterDistance", "İLÇE.MERKEZİNE.MESAFE", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }),
    cityCenterDistance: readEnvironmentalField("cityCenterDistance", "İL.MERKEZİNE.MESAFE", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }),
    siteName: readEnvironmentalField("addressSiteName", "BİNASİTE", { usePlaceholderTokens }),
    blockName: readEnvironmentalField("addressBlockName", "BİNABLOK", { usePlaceholderTokens, fallbackKeys: ["titleBlockName"] }),
    floor: readEnvironmentalField("addressFloor", "KAT.2", { usePlaceholderTokens, fallbackKeys: ["titleFloor"] }),
    unitNo: readEnvironmentalField("unitNo", "BB.NO", { usePlaceholderTokens }),
    regionUsePurpose: readEnvironmentalField("regionUsePurpose", "BÖLGE.YAP.KUL.AMACI", { usePlaceholderTokens }),
    regionBuildOrder: readEnvironmentalField("regionBuildOrder", "BÖLGE.YAP.NİZAMI", { usePlaceholderTokens }),
    regionFloorRange: readEnvironmentalField("regionFloorRange", "BÖLGE_YAP.KAT.ADEDİ", { usePlaceholderTokens }),
    developmentDensity: readEnvironmentalField("developmentDensity", "YAPILAŞMA", { usePlaceholderTokens }),
    developmentSpeed: readEnvironmentalField("developmentSpeed", "YAPILAŞMA.HIZI", { usePlaceholderTokens }),
    regionBuildingAge: readEnvironmentalField("regionBuildingAge", "BÖLGE.YAPI.YAŞI", { usePlaceholderTokens }),
    socialNeeds: readEnvironmentalField("socialNeeds", "SOSYALİHTİYAÇ", { usePlaceholderTokens }),
    incomeLevel: readEnvironmentalField("regionIncomeLevel", "BÖLGE.GELİR.SEVİYESİ", { usePlaceholderTokens }),
    mainArtery: readEnvironmentalField("mainArtery", "ULAŞIMANAARTERİ", { usePlaceholderTokens }),
    nearby: readEnvironmentalField("nearby", "YAKIN_CEVRESI", { usePlaceholderTokens }),
    planningHarmony: readEnvironmentalField("planningPrincipleHarmony", "PLANCILIK", { usePlaceholderTokens }),
    infrastructureLevel: readEnvironmentalField("infrastructureLevel", "ALTYAPI", { usePlaceholderTokens }),
    mainArteryProximity: readEnvironmentalField("mainArteryProximity", "ANA_ARTER_MESAFESİ", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }) || "yakın",
    commercialFunctionDensity: readEnvironmentalField("commercialFunctionDensity", "TİCARİ.FONKSİYON.YOĞUNLUĞU", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }) || "Yoğun",
    commercialFirmType: readEnvironmentalField("commercialFirmType", "TİCARİ.FİRMA.TİPİ", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }) || "Orta",
    commercialFrontageRoadType: readEnvironmentalField("commercialFrontageRoadType", "CEPHELİ.OLDUĞU.YOL", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }) || "Taşıt Yolu",
    commercialDevelopmentCompleted: readEnvironmentalField("commercialDevelopmentCompleted", "BÖLGE.YAPILAŞMA.TAMAMLANMIŞ.MI", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }) || "Evet",
    agriculturalActivityDensity: readEnvironmentalField("agriculturalActivityDensity", "TARIMSAL.FAALİYET.YOĞUNLUĞU", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }) || "Yoğun",
    agriculturalActivityTypes: readEnvironmentalField("agriculturalActivityTypes", "TARIMSAL.FAALİYET.TÜRÜ", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }),
    agriculturalSuitability: readEnvironmentalField("agriculturalSuitability", "TARIMSAL.KULLANIM.UYGUNLUĞU", { usePlaceholderTokens, fallbackKeys: [], fallbackToToken: false }) || "Uygun",
  };
  const detectedType = detectEnvironmentalRegionType(regionType);
  const intro = buildEnvironmentalIntro(values, { usePlaceholderTokens });
  const regionBuildOrderText = formatEnvironmentalList(values.regionBuildOrder);
  const buildOrderSentence = values.regionBuildOrder
    ? `Bölgede ağırlıklı olarak ${regionBuildOrderText} nizamlı yapılaşma görülmektedir. `
    : "";
  const speedSentence = values.developmentSpeed
    ? `Bölgedeki yapılaşma hızı ${values.developmentSpeed} seviyededir. `
    : "";
  const ageSentence = values.regionBuildingAge
    ? values.regionBuildingAge === "yeni"
      ? "Yapı stoku genel olarak yeni niteliktedir. "
      : `Yapı stokunun genel yaşı ${values.regionBuildingAge} yıl aralığındadır. `
    : "";
  const commercialFunctionSentence = buildCommercialFunctionSentence(values, { usePlaceholderTokens });
  const commercialFirmScale = usePlaceholderTokens
    ? values.commercialFirmType
    : `${String(values.commercialFirmType || "Orta").trim().toLocaleLowerCase("tr-TR")} ölçekli`;
  const industrialUsePurposeText = buildIndustrialUsePurposeText(values.regionUsePurpose, { usePlaceholderTokens });
  const agriculturalActivityText = buildAgriculturalActivityText(values.agriculturalActivityTypes, { usePlaceholderTokens });
  const agriculturalDensityText = usePlaceholderTokens
    ? values.agriculturalActivityDensity
    : String(values.agriculturalActivityDensity || "Yoğun").trim().toLocaleLowerCase("tr-TR");
  const agriculturalSuitabilityText = usePlaceholderTokens
    ? values.agriculturalSuitability
    : String(values.agriculturalSuitability || "Uygun").trim().toLocaleLowerCase("tr-TR");
  const agriculturalKmlDistanceSentence = buildAgriculturalKmlDistanceSentence(values, { usePlaceholderTokens });

  if (detectedType === "Tarımsal Alan") {
    return normalizeReportDescriptionText(
      `${intro} Taşınmazın bulunduğu bölge, tarımsal faaliyetlerin ${agriculturalDensityText} olarak sürdürüldüğü kırsal nitelikli bir çevrede yer almaktadır. ` +
        agriculturalKmlDistanceSentence +
        `Yakın çevresinde tarla, bağ, bahçe, zeytinlik, meyve bahçesi ve benzeri tarımsal amaçlı kullanılan taşınmazlar bulunmaktadır. ` +
        `Bölge genelinde yapılaşma yoğunluğu ${values.developmentDensity} olup yerleşim alanları daha çok köy/mahalle merkezi çevresinde gelişmiştir. ` +
        `Taşınmazın çevresi doğal karakterini büyük ölçüde korumakta olup bölgedeki ekonomik faaliyetler ağırlıklı olarak ${agriculturalActivityText} kullanımlarından oluşmaktadır. ` +
        `Ulaşım imkanları tarla yolları, köy yolları ve bağlantılı yollar üzerinden sağlanmakta olup ana ulaşım akslarına erişim mesafeye bağlı olarak değişkenlik göstermektedir. ` +
        `Altyapı hizmetleri bölgenin kırsal niteliğine bağlı olarak kısmen mevcut olup elektrik, yol ve su imkanları parsel bazında farklılık gösterebilmektedir. ` +
        `Mevcut çevresel özellikleri itibarıyla taşınmaz, tarımsal kullanım açısından ${agriculturalSuitabilityText} niteliktedir.`
    );
  }

  if (detectedType === "Sanayi Bölgesi") {
    return normalizeReportDescriptionText(
      `${intro} Taşınmazın bulunduğu yakın çevrede, genellikle ${industrialUsePurposeText} amaçlı ve zemin + ${values.regionFloorRange} katlı olacak şekilde yapılaşma söz konusudur. ${buildOrderSentence}` +
        `Bölgedeki yapılaşma ${values.developmentDensity} yoğunlukta olup üretim, servis ve depolama faaliyetlerine uygun bir çevre karakteri sunmaktadır. ` +
        speedSentence +
        ageSentence +
        `Bölgedeki üretim ve servis kullanımlarının gerektirdiği ulaşım, altyapı ve teknik ihtiyaçlar ${values.infrastructureLevel} derecede karşılanabilmektedir. ` +
        `Toplu taşıma ve servis güzergâhında yer alan ${values.mainArtery} yakınında bulunması, taşınmaza ulaşım ve ticari/üretim faaliyetleri açısından avantaj sağlamaktadır. ` +
        `Konu taşınmaza yakın konumda bulunan bilinen yerler; ${values.nearby} olarak ifade edilebilir. Bölgenin genel yapılaşma tarzı, plancılık ilkeleri ile ${values.planningHarmony}.`
    );
  }

  if (detectedType === "Ticaret Bölgesi") {
    return normalizeReportDescriptionText(
      `${intro} Taşınmazın bulunduğu yakın çevrede, genellikle ${values.regionUsePurpose} amaçlı ve muhtelif katta bodrum üzerine zemin + ${values.regionFloorRange} olacak şekilde yapılaşma söz konusudur. ${buildOrderSentence}` +
        `Yapılaşmanın ${values.developmentDensity} yoğunlukta olduğu bölgenin ticari potansiyeli ${commercialFirmScale} firmaların faaliyet göstermesine olanak sağlamaktadır. ` +
        speedSentence +
        ageSentence +
        commercialFunctionSentence +
        `Sosyal yaşamın gerektirdiği market benzeri ticari birimler ve sağlık ocağı, okul, çocuk parkı gibi ihtiyaçlar ${values.socialNeeds} mesafeden karşılanabilmektedir. ` +
        `Toplu taşıma güzergâhında yer alan ${values.mainArtery} yakınında bulunması, taşınmaza ulaşım açısından önemli bir avantaj sağlamaktadır. ` +
        `Bölgenin genel yapılaşma tarzı, plancılık ilkeleri ile ${values.planningHarmony}. Bölgesel alt yapı ihtiyacı ${values.infrastructureLevel} derecede karşılanabilmektedir.`
    );
  }

  return normalizeReportDescriptionText(
    `${intro} Taşınmazın bulunduğu yakın çevrede, genellikle ${values.regionUsePurpose} amaçlı ve bodrum kat üzerine zemin + ${values.regionFloorRange} katlı olacak şekilde yapılaşma söz konusudur. ${buildOrderSentence}` +
      `Yapılaşmanın ${values.developmentDensity} yoğunlukta olduğu bölgede, sosyal yaşamın gerektirdiği alışveriş, sağlık ocağı, okul, market vb. sosyal ihtiyaçlar ${values.socialNeeds} mesafelerde karşılanabilmektedir. ` +
      speedSentence +
      ageSentence +
      `Bölge, ${values.incomeLevel} gelir grubuna mensup kişilerin ikamet etmeyi tercih ettiği bir yerleşim karakterine sahiptir. ` +
      `Ayrıca toplu taşıma güzergâhında yer alan ${values.mainArtery} yakınında bulunması, taşınmaza ulaşım açısından önemli bir avantaj sağlamaktadır. ` +
      `Konu taşınmaza yakın konumda bulunan bilinen yerler; ${values.nearby} olarak ifade edilebilir. ` +
      `Bölgenin genel yapılaşma tarzı, plancılık ilkeleri ile ${values.planningHarmony}. Bölgesel alt yapı ihtiyacı (yol, elektrik, su, doğalgaz, kanalizasyon vb.) ${values.infrastructureLevel} derecede karşılanabilmektedir.`
  );
}

const buildingFloorCountFields = [
  { key: "basement", label: "Bodrum" },
  { key: "ground", label: "Zemin" },
  { key: "mezzanine", label: "Asma" },
  { key: "intermediate", label: "Ara" },
  { key: "normal", label: "Normal" },
  { key: "roof", label: "Çatı" },
  { key: "terrace", label: "Teras" },
];

const buildingStructureStyleOptions = [
  "",
  "Betonarme Karkas",
  "Çelik Konstrüksiyon",
  "Yığma",
  "Prefabrik",
  "Ahşap",
  "Karma Sistem",
];

const buildingOrderOptions = ["", "Ayrık", "Bitişik", "Blok", "İkiz", "Ayrık İkiz", "Kütle", "Serbest"];

const buildingClassOptions = [
  "",
  "1/A",
  "1/B",
  "1/C",
  "1/D",
  "2/A",
  "2/B",
  "2/C",
  "3/A",
  "3/B",
  "3/C",
  "4/A",
  "4/B",
  "4/C",
  "5/A",
  "5/B",
  "5/C",
  "5/D",
  "5/E",
];

const buildingBlockCountOptions = ["", "Tek", ...Array.from({ length: 99 }, (_, index) => String(index + 2))];

const buildingBlockPositionOptions = [
  "",
  "Kuzey",
  "Güney",
  "Doğu",
  "Batı",
  "Kuzeydoğu",
  "Kuzeybatı",
  "Güneydoğu",
  "Güneybatı",
  "Orta",
];

const buildingCarparkOptions = ["", "Kapalı Otopark", "Açık Otopark", "Kapalı Ve Açık Otopark", "Yok"];

const buildingExteriorCladdingOptions = [
  "",
  "Plastik Boyalı",
  "Mantolama Üzeri Plastik Boyalı",
  "Polimer Asıllı Dış Cephe Malzemesi Kaplı",
  "Seramik Kaplı",
  "Granit Kaplı",
  "Kompozit Dış Cephe Malzemesi Kaplı",
  "Kompakt Laminat Cephe Kaplama Sistemi İle Kaplı",
  "Ahşap Kaplı",
  "Ahşap Panel Kaplı",
  "Dekoratif Taş Cephe Kaplama Malzemesi Kaplı",
  "Cephe Kaplama Tuğlası Kaplı",
  "Sıvalı",
];

const buildingStairLandingOptions = [
  "",
  "Mermer Kaplı",
  "Seramik Kaplı",
  "Zemin Taşı Kaplı",
  "Karomozaik Kaplı",
  "Henüz Kaplaması Yapılmamış Vaziyette",
];

const buildingInteriorWallOptions = [
  "",
  "Plastik Boyalı",
  "Alçı Sıva Üzeri Saten Boyalı",
  "Seramik Kaplı",
  "Fayans Kaplı",
  "Sıvalı",
  "Sıvasız",
];

const buildingEntranceDoorOptions = [
  "",
  "Camlı Demir",
  "Camlı Alüminyum",
  "Demir Doğrama",
  "Ferforje",
  "Ahşap Kaplı Çelik",
  "Henüz Montajı Yapılmamıştır",
];

const buildingEntranceLevelOptions = [
  "",
  ...Array.from({ length: 7 }, (_, index) => `${7 - index}. Bodrum`),
  "Zemin",
  "Asma",
  "Ara",
  ...Array.from({ length: 30 }, (_, index) => `${index + 1}. Normal`),
  "Çatı Kat / Teras",
  "Teras Kat",
];

const buildingEntranceDirectionOptions = [
  "",
  "Kuzey",
  "Güney",
  "Doğu",
  "Batı",
  "Kuzeydoğu",
  "Kuzeybatı",
  "Güneydoğu",
  "Güneybatı",
];

const buildingSocialFacilityOptions = [
  "Açık Yüzme Havuzu",
  "Kapalı Yüzme Havuzu",
  "Özel Güvenlik",
  "Çocuk Bahçesi",
  "Spor Salonu",
  "Fitness",
  "Sauna",
  "Hamam",
  "Basketbol Sahası",
  "Tenis Kortu",
  "Açık Spor Alanı",
  "Yürüyüş Parkuru",
  "Kamelya / Oturma Alanı",
  "Peyzaj Alanı",
  "Sosyal Tesis Binası",
  "Jeneratör",
  "Hidrofor",
  "Su Deposu",
  "Yangın Merdiveni",
  "Site Yönetimi",
];

const buildingFloorUnitColumns = [
  { key: "common", label: "Ortak Ve Eklentiler", freeText: true },
  { key: "residential", label: "Daire", numeric: true },
  { key: "shop", label: "Dükkan", numeric: true },
  { key: "office", label: "Ofis", numeric: true },
  { key: "storage", label: "Depo", numeric: true },
];

function createBuildingFloorDistribution() {
  const wrapper = document.createElement("div");
  wrapper.className = "building-floor-editor";

  wrapper.append(createBuildingTechnicalOptionsPanel());

  const countPanel = document.createElement("div");
  countPanel.className = "subsection is-detail building-floor-count-panel";
  countPanel.innerHTML = `
    <div class="subsection-title-row">
      <h4>Ana Taşınmaz Kat Dağılımı</h4>
      <p>Her kat türü için adet giriniz; kaydedildiğinde alt kısımda kat satırları oluşur.</p>
    </div>
  `;

  const counts = getBuildingFloorCounts();
  const countGrid = document.createElement("div");
  countGrid.className = "building-floor-count-grid";
  buildingFloorCountFields.forEach((field) => {
    const label = document.createElement("label");
    label.className = "field";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.inputMode = "numeric";
    input.dataset.buildingFloorCount = field.key;
    input.value = counts[field.key] || "";
    label.append(createSpan(field.label), input);
    countGrid.append(label);
  });

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "primary-button building-floor-save-button";
  saveButton.textContent = "Kaydet";
  saveButton.addEventListener("click", () => {
    const nextCounts = {};
    countGrid.querySelectorAll("[data-building-floor-count]").forEach((input) => {
      nextCounts[input.dataset.buildingFloorCount] = normalizeNonNegativeInteger(input.value);
    });
    state.fields.buildingFloorCounts = nextCounts;
    state.tables.buildingFloors = buildBuildingFloorRowsFromCounts(nextCounts, state.tables.buildingFloors || []);
    updateBuildingFloorTotals();
    autosave();
    renderValidation();
    updateStatus();
    renderSection();
  });

  countPanel.append(countGrid, saveButton);
  wrapper.append(countPanel, createBuildingFloorRowsTable(), createMainPropertyDescriptionPanel());
  return wrapper;
}

function createBuildingTechnicalOptionsPanel() {
  const panel = document.createElement("div");
  panel.className = "subsection is-detail building-technical-panel";
  panel.innerHTML = `
    <div class="subsection-title-row">
      <h4>Ana Taşınmaz Teknik Bilgileri</h4>
      <p>Yapı tarzı, nizam, sınıf ve asansör bilgileri burada seçilir.</p>
    </div>
  `;

  const grid = document.createElement("div");
  grid.className = "building-technical-grid";
  const isHorizontalOwnership = shouldMentionMainPropertyOwnership(state.fields.ownershipType);
  const technicalFields = [
    createBuildingSelectField("Bina Yapı Tarzı", "buildingStyle", buildingStructureStyleOptions),
    createBuildingSelectField("Mevcut Yapı Nizamı", "buildingOrder", buildingOrderOptions),
    createBuildingSelectField("Yapı Sınıfı", "buildingClass", buildingClassOptions),
    createBuildingBlockCountControl(),
    createBuildingSelectField("Otopark", "carpark", buildingCarparkOptions),
  ];

  if (!isHorizontalOwnership) {
    technicalFields.splice(
      3,
      0,
      createBuildingSelectField("Asansör", "elevator", ["", "Yok", "1 Adet Asansör", "2 Adet Asansör", "3 Adet Asansör", "4 Adet Asansör", "Montajı henüz yapılmamıştır"]),
    );
    technicalFields.push(
      createBuildingSelectField("Dış Cephe Kaplama", "exteriorCladding", buildingExteriorCladdingOptions),
      createBuildingSelectField("Apartman Merdiven Ve Sahanlık", "stairLanding", buildingStairLandingOptions),
      createBuildingSelectField("Apartman İç Duvarlar", "interiorWalls", buildingInteriorWallOptions),
      createBuildingSelectField("Bina Giriş Kapısı", "buildingEntranceDoor", buildingEntranceDoorOptions),
      createBuildingSelectField("Bina Giriş Kat Seviyesi", "buildingEntranceLevel", buildingEntranceLevelOptions),
      createBuildingSelectField("Bina Giriş Yönü", "buildingEntranceDirection", buildingEntranceDirectionOptions),
    );
  }

  technicalFields.push(createBuildingSocialFacilitiesControl());
  grid.append(...technicalFields);
  panel.append(grid);
  return panel;
}

function createBuildingSelectField(labelText, key, options) {
  const label = document.createElement("label");
  label.className = "field";
  const select = document.createElement("select");
  select.dataset.field = key;
  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = options.includes(state.fields[key]) ? state.fields[key] : "";
  markFieldSourceState(select, key);
  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(key);
    state.fields[key] = event.target.value;
    refreshMainPropertyDescriptionFromCurrentFields(key);
    autosave();
    renderValidation();
    updateStatus();
  });
  label.append(createSpan(labelText), select);
  return label;
}

function createBuildingSocialFacilitiesControl() {
  const label = document.createElement("label");
  label.className = "field";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "multi-checkbox-summary";
  button.textContent = formatBuildingSocialFacilitiesSummary();
  button.addEventListener("click", () => {
    openBuildingSocialFacilitiesModal(() => {
      button.textContent = formatBuildingSocialFacilitiesSummary();
    });
  });

  label.append(createSpan("Sosyal Tesisler"), button);
  return label;
}

function formatBuildingSocialFacilitiesSummary() {
  const values = getMultiCheckboxValues("socialFacilities");
  return values.length ? values.join(", ") : "Yok";
}

function openBuildingSocialFacilitiesModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();
  const selected = new Set(getMultiCheckboxValues("socialFacilities"));

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card modal-card-wide" role="dialog" aria-modal="true" aria-labelledby="buildingSocialFacilitiesModalTitle">
      <div class="modal-head">
        <h3 id="buildingSocialFacilitiesModalTitle">Sosyal Tesisler</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <div class="checkbox-list checkbox-list-four">
          ${buildingSocialFacilityOptions.map((option) => `
            <label class="checkbox-pill">
              <input type="checkbox" value="${escapeHtml(option)}" data-building-social-facility ${selected.has(option) ? "checked" : ""}>
              <span>${escapeHtml(option)}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-building-social-clear>Yok</button>
        <button class="secondary-button" type="button" data-building-social-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-building-social-save>Kaydet</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-building-social-cancel]").addEventListener("click", close);
  overlay.querySelector("[data-building-social-clear]").addEventListener("click", () => {
    state.fields.socialFacilities = "";
    refreshMainPropertyDescriptionFromCurrentFields("socialFacilities");
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-building-social-save]").addEventListener("click", () => {
    state.fields.socialFacilities = [...overlay.querySelectorAll("[data-building-social-facility]:checked")]
      .map((checkbox) => checkbox.value)
      .join(", ");
    refreshMainPropertyDescriptionFromCurrentFields("socialFacilities");
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  overlay.querySelector("[data-building-social-facility]")?.focus();
}

function createBuildingBlockCountControl() {
  const label = document.createElement("label");
  label.className = "field";

  const control = document.createElement("div");
  control.className = "road-setback-control building-block-count-control";

  const select = document.createElement("select");
  select.dataset.field = "buildingBlockCount";
  buildingBlockCountOptions.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = buildingBlockCountOptions.includes(state.fields.buildingBlockCount) ? state.fields.buildingBlockCount : "";
  syncBuildingBlockCountDisplayOption(select);
  markFieldSourceState(select, "buildingBlockCount");

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "road-setback-detail-button";
  detailButton.textContent = "Detay";
  detailButton.disabled = !shouldShowBuildingBlockPositionDetail(select.value);

  const summary = document.createElement("small");
  summary.className = "road-setback-summary";
  summary.textContent = formatBuildingBlockPositionSummary();

  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership("buildingBlockCount");
    const nextValue = String(event.target.value || "").split("/")[0].trim();
    state.fields.buildingBlockCount = nextValue;
    select.value = nextValue;
    detailButton.disabled = !shouldShowBuildingBlockPositionDetail(nextValue);
    if (!shouldShowBuildingBlockPositionDetail(nextValue)) {
      state.fields.buildingSubjectBlockPosition = "";
    }
    syncBuildingBlockCountDisplayOption(select);
    refreshMainPropertyDescriptionFromCurrentFields("buildingBlockCount");
    autosave();
    renderValidation();
    updateStatus();
    if (shouldShowBuildingBlockPositionDetail(nextValue)) {
      openBuildingBlockPositionModal(() => {
        syncBuildingBlockCountDisplayOption(select);
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openBuildingBlockPositionModal(() => {
      syncBuildingBlockCountDisplayOption(select);
    });
  });

  control.append(select, detailButton);
  label.append(createSpan("Blok Adedi - Konumu"), control);
  return label;
}

function syncBuildingBlockCountDisplayOption(select) {
  const count = state.fields.buildingBlockCount || "";
  const position = state.fields.buildingSubjectBlockPosition || "";
  const displayValue = getBuildingBlockCountDisplayValue();
  const existingDisplay = select.querySelector("[data-building-block-display-option]");
  if (!displayValue || displayValue === count) {
    existingDisplay?.remove();
    select.value = buildingBlockCountOptions.includes(count) ? count : "";
    return;
  }
  const option = existingDisplay || document.createElement("option");
  option.dataset.buildingBlockDisplayOption = "true";
  option.value = displayValue;
  option.textContent = displayValue;
  if (!existingDisplay) select.prepend(option);
  select.value = position ? displayValue : count;
}

function getBuildingBlockCountDisplayValue() {
  const count = state.fields.buildingBlockCount || "";
  const position = state.fields.buildingSubjectBlockPosition || "";
  if (!shouldShowBuildingBlockPositionDetail(count) || !position) return count;
  return `${count} / ${position}`;
}

function shouldShowBuildingBlockPositionDetail(value) {
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) && count > 1;
}

function formatBuildingBlockPositionSummary() {
  if (!shouldShowBuildingBlockPositionDetail(state.fields.buildingBlockCount)) {
    if (state.fields.buildingBlockCount === "Tek") return "Tek blok.";
    return "Seçiniz.";
  }
  return state.fields.buildingSubjectBlockPosition
    ? `Konu taşınmazın yer aldığı blok: ${state.fields.buildingSubjectBlockPosition}`
    : "Konu taşınmazın blok konumu bekliyor.";
}

function openBuildingBlockPositionModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="buildingBlockPositionModalTitle">
      <div class="modal-head">
        <h3 id="buildingBlockPositionModalTitle">Blok Konumu</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>Konu Taşınmazın Yer Aldığı Blokun Parsel Üzerindeki Konumu</span>
          <select data-building-subject-block-position>
            ${buildingBlockPositionOptions.map((option) => `
              <option value="${escapeHtml(option)}">${escapeHtml(option || "Seçiniz")}</option>
            `).join("")}
          </select>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-building-block-position-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-building-block-position-save>Kaydet</button>
      </div>
    </div>
  `;

  const positionSelect = overlay.querySelector("[data-building-subject-block-position]");
  positionSelect.value = state.fields.buildingSubjectBlockPosition || "";

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-building-block-position-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-building-block-position-save]").addEventListener("click", () => {
    state.fields.buildingSubjectBlockPosition = positionSelect.value;
    refreshMainPropertyDescriptionFromCurrentFields("buildingSubjectBlockPosition");
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  positionSelect.focus();
}

function getBuildingFloorCounts() {
  const counts = state.fields.buildingFloorCounts && typeof state.fields.buildingFloorCounts === "object"
    ? state.fields.buildingFloorCounts
    : {};
  return buildingFloorCountFields.reduce((result, field) => {
    result[field.key] = normalizeNonNegativeInteger(counts[field.key]);
    return result;
  }, {});
}

function normalizeNonNegativeInteger(value) {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

function buildBuildingFloorRowsFromCounts(counts, existingRows = []) {
  const existingByName = new Map(
    existingRows
      .filter((row) => row?.floorName)
      .map((row) => [row.floorName, row])
  );
  return getBuildingFloorNamesFromCounts(counts).map((floorName) => ({
    floorName,
    common: existingByName.get(floorName)?.common || "",
    residential: existingByName.get(floorName)?.residential || "",
    shop: existingByName.get(floorName)?.shop || "",
    office: existingByName.get(floorName)?.office || "",
    storage: existingByName.get(floorName)?.storage || "",
  }));
}

function getBuildingFloorNamesFromCounts(counts) {
  const names = [];
  const basementCount = Number.parseInt(counts.basement || "0", 10) || 0;
  for (let index = basementCount; index >= 1; index -= 1) {
    names.push(`${index}. Bodrum`);
  }
  if ((Number.parseInt(counts.ground || "0", 10) || 0) > 0) names.push("Zemin");
  const mezzanineCount = Number.parseInt(counts.mezzanine || "0", 10) || 0;
  for (let index = 1; index <= mezzanineCount; index += 1) {
    names.push(mezzanineCount === 1 ? "Asma" : `${index}. Asma`);
  }
  const intermediateCount = Number.parseInt(counts.intermediate || "0", 10) || 0;
  for (let index = 1; index <= intermediateCount; index += 1) {
    names.push(intermediateCount === 1 ? "Ara" : `${index}. Ara`);
  }
  const normalCount = Number.parseInt(counts.normal || "0", 10) || 0;
  for (let index = 1; index <= normalCount; index += 1) {
    names.push(`${index}. Normal`);
  }
  const roofCount = Number.parseInt(counts.roof || "0", 10) || 0;
  for (let index = 1; index <= roofCount; index += 1) {
    names.push(roofCount === 1 ? "Çatı" : `${index}. Çatı`);
  }
  const terraceCount = Number.parseInt(counts.terrace || "0", 10) || 0;
  for (let index = 1; index <= terraceCount; index += 1) {
    names.push(terraceCount === 1 ? "Teras" : `${index}. Teras`);
  }
  return names;
}

function createBuildingFloorRowsTable() {
  const panel = document.createElement("div");
  panel.className = "subsection is-detail building-floor-table-panel";
  const rows = Array.isArray(state.tables.buildingFloors) ? state.tables.buildingFloors : [];
  state.tables.buildingFloors = rows;

  const heading = document.createElement("div");
  heading.className = "subsection-table-head";
  heading.innerHTML = `<h4>Kat Satırları</h4>`;

  const shell = document.createElement("div");
  shell.className = "table-shell";

  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-frontage-list";
    empty.textContent = "Kat adedi girilip Kaydet düğmesine basıldığında kat satırları burada oluşur.";
    shell.append(empty);
    panel.append(heading, shell);
    return panel;
  }

  const table = document.createElement("table");
  table.className = "table-building-floors";
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Kat Adı</th>
      ${buildingFloorUnitColumns.map((column) => `<th>${column.label}</th>`).join("")}
    </tr>
  `;
  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = row.floorName || "";
    tr.append(nameCell);

    buildingFloorUnitColumns.forEach((column) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = column.numeric ? "number" : "text";
      if (column.numeric) {
        input.min = "0";
        input.step = "1";
        input.inputMode = "numeric";
      }
      input.value = row[column.key] || "";
      input.addEventListener("input", (event) => {
        row[column.key] = column.numeric
          ? normalizeNonNegativeInteger(event.target.value)
          : event.target.value;
        if (column.numeric) event.target.value = row[column.key];
        updateBuildingFloorTotals();
        updateBuildingFloorSummary(panel);
        autosave();
      });
      input.addEventListener("blur", () => {
        if (!column.freeText) return;
        const formattedValue = normalizeReportDescriptionText(input.value);
        input.value = formattedValue;
        row[column.key] = formattedValue;
        autosave();
      });
      td.append(input);
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  shell.append(table);
  panel.append(heading, shell);
  const summary = document.createElement("div");
  summary.className = "building-floor-summary";
  panel.append(summary);
  updateBuildingFloorSummary(panel);
  return panel;
}

function updateBuildingFloorTotals() {
  const rows = Array.isArray(state.tables.buildingFloors) ? state.tables.buildingFloors : [];
  const totalFloors = rows.filter((row) => isCountableBuildingFloor(row.floorName)).length;
  const totalUnits = rows.reduce((sum, row) => (
    sum
    + parseBuildingFloorCount(row.residential)
    + parseBuildingFloorCount(row.shop)
    + parseBuildingFloorCount(row.office)
    + parseBuildingFloorCount(row.storage)
  ), 0);
  state.fields.totalFloors = totalFloors ? String(totalFloors) : "";
  state.fields.totalUnits = totalUnits ? String(totalUnits) : "";
}

function isCountableBuildingFloor(floorName) {
  const name = String(floorName || "").toLocaleLowerCase("tr");
  return !/(asma|ara|çatı|cati)/i.test(name);
}

function updateBuildingFloorSummary(container) {
  const summary = container.querySelector(".building-floor-summary");
  if (!summary) return;
  updateBuildingFloorTotals();
  const summaryText = buildBuildingFloorMacroSummary();
  state.fields.mainPropertyFloorSummary = summaryText;
  summary.innerHTML = "";
  const totalLine = document.createElement("strong");
  totalLine.textContent = `Toplam kat: ${state.fields.totalFloors || "0"} | Toplam bağımsız bölüm: ${state.fields.totalUnits || "0"}`;
  summary.append(totalLine);
  if (summaryText) {
    const detail = document.createElement("p");
    detail.textContent = summaryText;
    summary.append(detail);
  }
  refreshMainPropertyDescriptionFromCurrentFields("buildingFloorRows");
}

function parseBuildingFloorCount(value) {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createMainPropertyDescriptionPanel() {
  const panel = document.createElement("div");
  panel.className = "subsection is-detail building-description-panel";
  panel.innerHTML = `
    <div class="subsection-title-row">
      <h4>Ana Gayrimenkul Açıklaması</h4>
      <p>Seçilen teknik bilgiler ve kat dağılımına göre ana taşınmaz paragrafı oluşturulur.</p>
    </div>
  `;

  const label = document.createElement("label");
  label.className = "field field-wide";
  const textarea = document.createElement("textarea");
  textarea.dataset.field = "mainPropertyDescription";
  textarea.rows = 8;
  const nextDescription = state.fields.mainPropertyDescription || buildMainPropertyDescription();
  state.fields.mainPropertyDescription = nextDescription;
  textarea.value = nextDescription;
  textarea.addEventListener("input", (event) => {
    state.fields.mainPropertyDescription = event.target.value;
    autosave();
    renderValidation();
    updateStatus();
  });
  textarea.addEventListener("blur", () => {
    const formattedValue = normalizeReportDescriptionText(textarea.value);
    textarea.value = formattedValue;
    state.fields.mainPropertyDescription = formattedValue;
    autosave();
  });

  const actions = document.createElement("div");
  actions.className = "unit-decorative-actions";
  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.className = "secondary-button";
  refreshButton.textContent = "Ana taşınmaz açıklamasını yenile";
  refreshButton.addEventListener("click", () => {
    state.fields.mainPropertyDescription = buildMainPropertyDescription();
    autosave();
    renderSection();
    renderValidation();
    updateStatus();
  });
  actions.append(refreshButton);

  label.append(createSpan("Ana Gayrimenkul Açıklaması"), textarea, actions);
  panel.append(label);
  return panel;
}

const mainPropertyDescriptionAutoRefreshFields = new Set([
  "appointmentType",
  "ownershipType",
  "blockNo",
  "parcelNo",
  "landArea",
  "buildingStyle",
  "buildingOrder",
  "buildingClass",
  "titleBlockName",
  "elevator",
  "buildingBlockCount",
  "buildingSubjectBlockPosition",
  "carpark",
  "exteriorCladding",
  "stairLanding",
  "interiorWalls",
  "buildingEntranceDoor",
  "buildingEntranceLevel",
  "buildingEntranceDirection",
  "socialFacilities",
  "mainRealEstateProjectSuitable",
  "mainRealEstateProjectSuitabilityNote",
  "buildingFloorRows",
]);

function refreshMainPropertyDescriptionFromCurrentFields(changedKey = "") {
  if (!mainPropertyDescriptionAutoRefreshFields.has(changedKey)) return;
  const nextDescription = buildMainPropertyDescription();
  state.fields.mainPropertyDescription = nextDescription;
  const control = document.querySelector('[data-field="mainPropertyDescription"]');
  if (control && control.value !== nextDescription) {
    control.value = nextDescription;
  }
}

function buildMainPropertyDescription(options = {}) {
  const usePlaceholderTokens = Boolean(options.usePlaceholderTokens);
  updateBuildingFloorTotals();
  const values = {
    landArea: readMainPropertyField("landArea", "ANA.TAŞINMAZ.YÜZÖLÇÜMÜ", { usePlaceholderTokens }),
    blockNo: readMainPropertyField("blockNo", "ADA", { usePlaceholderTokens }),
    parcelNo: readMainPropertyField("parcelNo", "PARSEL", { usePlaceholderTokens }),
    ownershipType: readMainPropertyField("ownershipType", "MÜLKİYET.TÜRÜ", { usePlaceholderTokens }),
    appointmentType: readMainPropertyField("appointmentType", "RANDEVU.TÜRÜ", { usePlaceholderTokens, fallbackToToken: false }),
    buildingStyle: readMainPropertyField("buildingStyle", "BİNA.YAPI.TARZI", { usePlaceholderTokens }),
    buildingOrder: readMainPropertyField("buildingOrder", "MEVCUT.YAPI.NİZAMI", { usePlaceholderTokens }),
    buildingClass: readMainPropertyField("buildingClass", "YAPI.SINIFI", { usePlaceholderTokens }),
    titleBlockName: readMainPropertyField("titleBlockName", "BİNABLOK", { usePlaceholderTokens, fallbackToToken: false }),
    elevator: readMainPropertyField("elevator", "ASANSÖR", { usePlaceholderTokens }),
    blockCount: readMainPropertyField("buildingBlockCount", "BLOK.ADEDİ", { usePlaceholderTokens }),
    blockPosition: readMainPropertyField("buildingSubjectBlockPosition", "BLOĞUN.KONUMU", { usePlaceholderTokens, fallbackToToken: false }),
    carpark: readMainPropertyField("carpark", "OTOPARK", { usePlaceholderTokens }),
    exteriorCladding: readMainPropertyField("exteriorCladding", "DIŞ.CEPHE.KAPLAMA", { usePlaceholderTokens }),
    stairLanding: readMainPropertyField("stairLanding", "MERDİVEN.SAHANLIK", { usePlaceholderTokens }),
    interiorWalls: readMainPropertyField("interiorWalls", "APARTMAN.İÇ.DUVARLAR", { usePlaceholderTokens }),
    entranceDoor: readMainPropertyField("buildingEntranceDoor", "BİNA.GİRİŞ.KAPISI", { usePlaceholderTokens }),
    entranceLevel: readMainPropertyField("buildingEntranceLevel", "BİNA.GİRİŞ.KAT.SEVİYESİ", { usePlaceholderTokens, fallbackToToken: false }),
    entranceDirection: readMainPropertyField("buildingEntranceDirection", "BİNA.GİRİŞ.YÖNÜ", { usePlaceholderTokens, fallbackToToken: false }),
    socialFacilities: readMainPropertyField("socialFacilities", "SOSYAL.TESİSLER", { usePlaceholderTokens, fallbackToToken: false }),
    heatingType: readMainPropertyField("unitHeatingType", "ISINMA.SİSTEMİ", { usePlaceholderTokens, fallbackToToken: false }),
    projectSuitable: readMainPropertyField("mainRealEstateProjectSuitable", "ANA.GAYRİMENKUL.PROJESİNE.UYGUN.MU", { usePlaceholderTokens, fallbackToToken: false }) || "Evet",
    projectNote: readMainPropertyField("mainRealEstateProjectSuitabilityNote", "ANA.GAYRİMENKUL.PROJE.UYGUNLUK.AÇIKLAMA", { usePlaceholderTokens, fallbackToToken: false }),
    floorComposition: buildMainPropertyFloorComposition({ usePlaceholderTokens }),
    floorSummary: usePlaceholderTokens ? "{{ANA.TAŞINMAZ.KAT.DAĞILIMI}}" : buildBuildingFloorMacroSummary(),
    totalFloors: readMainPropertyField("totalFloors", "TOPLAM.KAT", { usePlaceholderTokens, fallbackToToken: false }),
    totalUnits: readMainPropertyField("totalUnits", "TOPLAM.BAĞIMSIZ.BÖLÜM", { usePlaceholderTokens, fallbackToToken: false }),
  };

  if (shouldMentionMainPropertyOwnership(values.ownershipType)) {
    return buildHorizontalMainPropertyDescription(values);
  }

  const paragraphs = [
    joinNonEmptySentences([
      buildMainPropertyOpeningSentence(values),
      buildMainPropertyBlockPositionSentence(values),
    ]),
    buildMainPropertyProjectSentence(values),
    buildMainPropertyFloorSentence(values),
    joinNonEmptySentences([
      buildMainPropertyEntranceSentence(values),
      buildMainPropertyPhysicalSentence(values),
      buildMainPropertyAmenitySentence(values),
    ]),
  ]
    .map((paragraph) => normalizeReportDescriptionText(cleanComparablePunctuation(paragraph)))
    .filter(Boolean);

  return paragraphs.join("\n\n");
}

function buildHorizontalMainPropertyDescription(values) {
  const paragraphs = [
    joinNonEmptySentences([
      buildMainPropertyOpeningSentence(values),
      buildMainPropertyBlockPositionSentence(values),
    ]),
    buildMainPropertyProjectSentence(values),
    buildHorizontalMainPropertySiteSentence(values),
    buildHorizontalMainPropertyFloorSentence(values),
    buildHorizontalMainPropertyAmenitySentence(values),
  ]
    .map((paragraph) => normalizeReportDescriptionText(cleanComparablePunctuation(paragraph)))
    .filter(Boolean);

  return paragraphs.join("\n\n");
}

function buildHorizontalMainPropertySiteSentence(values) {
  const order = values.buildingOrder ? `${toLowerText(values.buildingOrder)} nizamda` : "site bütünlüğünde";
  const usePhrase = detectHorizontalBlockUsePhrase();
  const totalUnits = parseBuildingFloorCount(values.totalUnits);
  const totalText = totalUnits
    ? ` Site genelinde toplam ${totalUnits.toLocaleString("tr-TR")} adet bağımsız bölüm bulunmaktadır.`
    : "";
  return `Değerlemeye konu bağımsız bölümün yer aldığı ana taşınmaz, yatay kat irtifakı tesis edilmiş site niteliğindedir. Parsel üzerinde ${order} inşa edilmiş ${usePhrase} blokları bulunmakta olup, her bir bağımsız bölüm site bütünlüğü içerisinde müstakil kullanım alanına sahip olacak şekilde düzenlenmiştir.${totalText}`;
}

function detectHorizontalBlockUsePhrase() {
  const text = [
    state.fields?.regionUsePurpose,
    state.fields?.titleQuality,
    state.fields?.legalUsageArea,
    state.fields?.currentUsageArea,
    state.fields?.legend,
    state.fields?.mainPropertyQuality,
  ].filter(Boolean).join(" ");
  const folded = foldTurkish(text);
  if (folded.includes("SANAYI")) return "sanayi";
  if (folded.includes("TICARET") || folded.includes("DUKKAN") || folded.includes("OFIS")) return "ticari";
  return "villa/konut";
}

function buildHorizontalMainPropertyFloorSentence(values) {
  if (!values.floorComposition) return "";
  const floorText = values.totalFloors ? ` olmak üzere toplam ${values.totalFloors} kattan` : "";
  return `Her bir blok ${values.floorComposition}${floorText} oluşmaktadır.`;
}

function buildHorizontalMainPropertyAmenitySentence(values) {
  const sentences = [];
  const carpark = toLowerText(values.carpark);
  const social = String(values.socialFacilities || "").trim();
  if (carpark && carpark !== "yok") {
    sentences.push(`Site genelinde ${carpark} imkanı bulunmaktadır.`);
  } else if (carpark === "yok") {
    sentences.push("Site genelinde otopark imkanı bulunmamaktadır.");
  }
  if (social && social.toLocaleLowerCase("tr-TR") !== "yok") {
    sentences.push(`Taşınmaz ${formatTurkishList(social.split(/\s*,\s*/).filter(Boolean).map(toLowerText))} gibi sosyal imkanların bulunduğu bir sitede yer almaktadır.`);
  }
  return sentences.join(" ");
}

function readMainPropertyField(primaryKey, token, options = {}) {
  if (options.usePlaceholderTokens) return `{{${token}}}`;
  const rawValue = state.fields?.[primaryKey];
  const value = String(rawValue || "").trim();
  if (value) return value;
  return options.fallbackToToken ? `{{${token}}}` : "";
}

function buildMainPropertyOpeningSentence(values) {
  const blockCountText = String(values.blockCount || "").trim();
  const context = getMainPropertyStructureContext(values);
  const structureName = context.isSite ? "site" : "bina";
  const parcelParts = [];
  if (values.landArea) parcelParts.push(`${values.landArea} yüzölçümüne sahip`);
  if (values.blockNo && values.parcelNo) parcelParts.push(`${values.blockNo} ada ${values.parcelNo} no.lu parsel üzerinde`);
  else if (values.parcelNo) parcelParts.push(`${values.parcelNo} no.lu parsel üzerinde`);
  const parcelPhrase = parcelParts.length ? `, ${parcelParts.join(" ")}` : "";

  const technicalParts = [];
  if (values.buildingOrder) technicalParts.push(`${toLowerText(values.buildingOrder)} nizam`);
  if (values.buildingStyle) technicalParts.push(`${toLowerText(values.buildingStyle)} yapı tarzında`);
  const technicalPhrase = technicalParts.length ? `, ${formatTurkishList(technicalParts)}` : "";
  const classPhrase = values.buildingClass ? ` (yapı sınıfı ${values.buildingClass})` : "";
  const ownershipPhrase = shouldMentionMainPropertyOwnership(values.ownershipType) ? " yatay kat irtifak türünde" : "";
  const blockPhrase = blockCountText ? ` ${context.blockCountLower === "tek" ? "tek blok" : `${blockCountText} blok`} olarak` : "";
  return `Ekspertize konu taşınmazın yer aldığı ${structureName}${parcelPhrase}${technicalPhrase}${classPhrase}${ownershipPhrase}${blockPhrase} inşa edilmiştir.`;
}

function buildMainPropertyProjectSentence(values) {
  const appointment = foldTurkish(values.appointmentType || "");
  const isExternal = appointment.includes("DISARIDAN");
  const isLimited = appointment.includes("KISITLI");
  const isSuitable = normalizeYesNoChoice(values.projectSuitable || "Evet") !== "Hayır";
  const limitedPrefix = isExternal
    ? "Taşınmazın incelemesi dışarıdan yapılmış olup, "
    : "";
  const inspectionPhrase = isExternal || isLimited
    ? "kısıtlı inceleme kapsamında yapılan tespitler itibarıyla"
    : "mahallinde yapılan incelemelere göre";
  if (isSuitable) {
    return `${limitedPrefix}ana taşınmazın incelenen mimari projesi ile ${inspectionPhrase} uyumlu olduğu değerlendirilmiştir.`;
  }
  const note = normalizeReportDescriptionText(values.projectNote || "");
  return `${limitedPrefix}ana taşınmazın incelenen mimari projesi ile ${inspectionPhrase} farklılık bulunduğu değerlendirilmiştir${note ? `; ${note}` : ""}.`;
}

function buildMainPropertyFloorSentence(values) {
  const parts = [];
  if (values.floorComposition) {
    parts.push(`Ana taşınmaz ${values.floorComposition}${values.totalFloors ? ` olmak üzere toplam ${values.totalFloors} katlı` : ""} olarak inşa edilmiştir.`);
  }
  if (values.floorSummary) parts.push(values.floorSummary);
  return parts.join(" ");
}

function buildMainPropertyBlockPositionSentence(values) {
  const blockCount = String(values.blockCount || "").trim();
  const context = getMainPropertyStructureContext(values);
  if (context.isSite || (blockCount && context.blockCountLower !== "tek")) {
    const blockLabel = context.titleBlockName
      ? (/\bblok\b/i.test(context.titleBlockName) ? context.titleBlockName : `${context.titleBlockName} Blok`)
      : "blok";
    if (values.blockPosition) {
      return `Ekspertize konu taşınmazın yer aldığı ${blockLabel} parselin ${toLowerText(values.blockPosition)} cephesinde yer almaktadır.`;
    }
    return `Ekspertize konu taşınmazın yer aldığı ${blockLabel} için parsel üzerindeki blok konumu belirtilmemiştir.`;
  }
  return "";
}

function buildMainPropertyEntranceSentence(values) {
  const parts = [];
  const entranceParts = [];
  if (values.entranceDirection) entranceParts.push(`${toLowerText(values.entranceDirection)} yönünden`);
  if (values.entranceLevel) {
    const levelPhrase = formatBuildingEntranceLevelPhrase(values.entranceLevel);
    if (levelPhrase) entranceParts.push(levelPhrase);
  }
  if (entranceParts.length) parts.push(`Bina girişi ${formatTurkishList(entranceParts)} sağlanmaktadır.`);
  const doorSentence = buildBuildingEntranceDoorSentence(values.entranceDoor);
  if (doorSentence) parts.push(doorSentence);
  return parts.join(" ");
}

function formatBuildingEntranceLevelPhrase(level) {
  const text = toLowerText(level);
  if (!text) return "";
  if (text === "zemin") return "zemin kat seviyesinden";
  if (/\bkat\b/.test(text)) return `${text} seviyesinden`;
  return `${text} kat seviyesinden`;
}

function buildBuildingEntranceDoorSentence(door) {
  const text = toLowerText(door);
  if (!text) return "";
  if (text.includes("montaj") || text.includes("yapılmam")) {
    return "Bina giriş kapısının montajı henüz yapılmamıştır.";
  }
  if (text.includes("alüminyum")) return "Bina girişi camlı alüminyum doğramadır.";
  if (text.includes("camlı demir")) return "Bina girişi camlı demir doğramadır.";
  if (text.includes("demir doğrama")) return "Bina girişi demir doğramadır.";
  if (text.includes("ferforje")) return "Bina giriş kapısı ferforjedir.";
  if (text.includes("çelik")) return "Bina giriş kapısı ahşap kaplı çeliktir.";
  return `Bina giriş kapısı ${text} şeklindedir.`;
}

function buildMainPropertyPhysicalSentence(values) {
  const parts = [];
  if (values.exteriorCladding) parts.push(`dış cephesi ${toLowerText(values.exteriorCladding)}`);
  if (values.stairLanding) parts.push(`merdiven basamakları ve sahanlıkları ${toLowerText(values.stairLanding)}`);
  if (values.interiorWalls) parts.push(`apartman iç duvarları ${toLowerText(values.interiorWalls)}`);
  return parts.length ? `${formatTurkishList(parts)} vaziyettedir.` : "";
}

function buildMainPropertyAmenitySentence(values) {
  const sentences = [];
  const context = getMainPropertyStructureContext(values);
  sentences.push(...buildBuildingCarparkElevatorSentences(values, context));
  const social = String(values.socialFacilities || "").trim();
  if (social && social.toLocaleLowerCase("tr-TR") !== "yok") {
    sentences.push(`Taşınmaz ${formatTurkishList(social.split(/\s*,\s*/).filter(Boolean).map(toLowerText))} gibi sosyal imkanların bulunduğu bir ${context.siteOrBuildingLocative} yer almaktadır.`);
  }
  return sentences.join(" ");
}

function getMainPropertyStructureContext(values) {
  const blockCountText = String(values.blockCount || "").trim();
  const blockCountLower = blockCountText.toLocaleLowerCase("tr-TR");
  const titleBlockName = String(values.titleBlockName || "").trim();
  const isSite = Boolean(titleBlockName) || (blockCountText && blockCountLower !== "tek");
  return {
    blockCountLower,
    titleBlockName,
    isSite,
    unitPlace: isSite ? "blokta" : "binada",
    siteOrBuildingLocative: isSite ? "sitede" : "binada",
  };
}

function shouldMentionMainPropertyOwnership(ownershipType) {
  const folded = foldTurkish(ownershipType || "");
  return folded.includes("YATAY") && folded.includes("KAT") && folded.includes("IRTIFAK");
}

function buildBuildingCarparkElevatorSentences(values, context) {
  const carpark = toLowerText(values.carpark);
  const elevator = toLowerText(values.elevator);
  const heating = toLowerText(values.heatingType);
  const hasCarpark = carpark && carpark !== "yok";
  const hasElevator = elevator && elevator !== "yok" && !elevator.includes("montaj");
  const elevatorPending = elevator && elevator.includes("montaj");
  const sentences = [];

  if (hasElevator) {
    sentences.push(`Taşınmazın yer aldığı ${context.unitPlace} ${elevator} bulunmaktadır.`);
  } else if (elevator === "yok") {
    sentences.push(`Taşınmazın yer aldığı ${context.unitPlace} asansör bulunmamaktadır.`);
  } else if (elevatorPending) {
    sentences.push(`Taşınmazın yer aldığı ${context.unitPlace} asansör montajı henüz yapılmamıştır.`);
  }

  if (hasCarpark) {
    const structureName = context.isSite ? "Site" : "Bina";
    sentences.push(`${structureName} genelinde ${carpark} imkanı bulunmaktadır.`);
    if (heating) sentences.push(`Isınma ${heating} sistemi ile sağlanmaktadır.`);
  } else if (carpark === "yok") {
    sentences.push(`${capitalizeTurkishSentence(`${context.siteOrBuildingLocative} otopark imkanı bulunmamaktadır`)}.`);
    if (heating) sentences.push(`Isınma ${heating} sistemi ile sağlanmaktadır.`);
  } else if (heating) {
    sentences.push(`Isınma ${heating} sistemi ile sağlanmaktadır.`);
  }

  return sentences;
}

function capitalizeTurkishSentence(text) {
  const value = String(text || "").trim();
  return value ? value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1) : "";
}

function buildMainPropertyFloorComposition(options = {}) {
  if (options.usePlaceholderTokens) return "{{ANA.TAŞINMAZ.KAT.KOMPOZİSYONU}}";
  const counts = getBuildingFloorCounts();
  const parts = [];
  const basement = parseBuildingFloorCount(counts.basement);
  const ground = parseBuildingFloorCount(counts.ground);
  const mezzanine = parseBuildingFloorCount(counts.mezzanine);
  const intermediate = parseBuildingFloorCount(counts.intermediate);
  const normal = parseBuildingFloorCount(counts.normal);
  const roof = parseBuildingFloorCount(counts.roof);
  const terrace = parseBuildingFloorCount(counts.terrace);
  if (basement) parts.push(basement === 1 ? "bodrum" : `${basement} bodrum`);
  if (ground) parts.push("zemin");
  if (mezzanine) parts.push(mezzanine === 1 ? "asma kat" : `${mezzanine} asma kat`);
  if (intermediate) parts.push(intermediate === 1 ? "ara kat" : `${intermediate} ara kat`);
  if (normal) parts.push(`${normal} normal kat`);
  if (roof) parts.push(roof === 1 ? "çatı katı" : `${roof} çatı katı`);
  if (terrace) parts.push(terrace === 1 ? "teras kat" : `${terrace} teras kat`);
  return parts.join(" + ");
}

function buildBuildingFloorMacroSummary() {
  const rows = (Array.isArray(state.tables.buildingFloors) ? state.tables.buildingFloors : [])
    .filter((row) => String(row?.floorName || "").trim());
  if (!rows.length) return "";

  const rowParts = rows.map(() => []);
  const counts = rows.map((row) => buildingFloorUnitColumns.map((column) => (
    column.numeric ? parseBuildingFloorCount(row[column.key]) : 0
  )));
  const normalFlags = rows.map((row) => isNormalBuildingFloor(row.floorName));
  const mixedNormalFlags = rows.map(() => false);

  rows.forEach((row, rowIndex) => {
    const manualText = normalizeReportDescriptionText(row.common || "");
    const nonZeroIndexes = counts[rowIndex]
      .map((value, index) => (value > 0 ? index : -1))
      .filter((index) => index >= 0);

    if (normalFlags[rowIndex]) {
      if (nonZeroIndexes.length >= 2) {
        mixedNormalFlags[rowIndex] = true;
        if (manualText) appendBuildingFloorSummaryPart(rowParts[rowIndex], `${formatBuildingFloorLocative(row.floorName)} ${manualText}`);
        appendBuildingFloorSummaryPart(rowParts[rowIndex], `${formatBuildingFloorLocative(row.floorName)} ${joinBuildingUnitCounts(counts[rowIndex])}`);
      } else if (manualText) {
        appendBuildingFloorSummaryPart(rowParts[rowIndex], `${formatBuildingFloorLocative(row.floorName)} ${manualText}`);
      }
      return;
    }

    const pieces = [];
    if (manualText) pieces.push(manualText);
    const unitText = joinBuildingUnitCounts(counts[rowIndex]);
    if (unitText) pieces.push(unitText);
    if (pieces.length) appendBuildingFloorSummaryPart(rowParts[rowIndex], `${formatBuildingFloorLocative(row.floorName)} ${joinTurkishList(pieces)}`);
  });

  const normalIndexes = rows
    .map((row, index) => (normalFlags[index] ? index : -1))
    .filter((index) => index >= 0);

  buildingFloorUnitColumns.forEach((column, columnIndex) => {
    if (!column.numeric || !normalIndexes.length) return;
    const sameValue = counts[normalIndexes[0]][columnIndex];
    const allNormalFloorsSame = sameValue > 0 && normalIndexes.every((rowIndex) => (
      !mixedNormalFlags[rowIndex] && counts[rowIndex][columnIndex] === sameValue
    ));

    if (allNormalFloorsSame) {
      const firstIndex = normalIndexes[0];
      if (normalIndexes.length > 2) {
        appendBuildingFloorSummaryPart(
          rowParts[firstIndex],
          `${normalIndexes.length} normal katın her birinde ${sameValue}${getBuildingDistributionSuffix(sameValue)} ${formatBuildingUnitLabel(column.label)}`,
        );
      } else if (normalIndexes.length === 2) {
        appendBuildingFloorSummaryPart(
          rowParts[firstIndex],
          `${formatBuildingFloorNameForList(rows[normalIndexes[0]].floorName)} ve ${formatBuildingFloorLocative(rows[normalIndexes[1]].floorName)} ${sameValue}${getBuildingDistributionSuffix(sameValue)} ${formatBuildingUnitLabel(column.label)}`,
        );
      } else {
        appendBuildingFloorSummaryPart(
          rowParts[firstIndex],
          `${formatBuildingFloorLocative(rows[firstIndex].floorName)} ${sameValue} adet ${formatBuildingUnitLabel(column.label)}`,
        );
      }
      return;
    }

    let start = -1;
    let currentValue = 0;
    for (let index = 0; index <= rows.length; index += 1) {
      const eligible = index < rows.length
        && normalFlags[index]
        && !mixedNormalFlags[index]
        && counts[index][columnIndex] > 0;

      if (eligible) {
        if (start < 0) {
          start = index;
          currentValue = counts[index][columnIndex];
        } else if (counts[index][columnIndex] !== currentValue) {
          writeBuildingNormalGroup(rowParts, rows, start, index - 1, currentValue, column.label);
          start = index;
          currentValue = counts[index][columnIndex];
        }
      } else if (start >= 0) {
        writeBuildingNormalGroup(rowParts, rows, start, index - 1, currentValue, column.label);
        start = -1;
        currentValue = 0;
      }
    }
  });

  const parts = rowParts.flatMap((items) => items);
  const totalUnits = parseBuildingFloorCount(state.fields.totalUnits);
  const text = parts.join(", ");
  if (!totalUnits) return cleanComparablePunctuation(text);
  return cleanComparablePunctuation(`${text}${text ? " olmak üzere " : ""}binada toplam ${totalUnits} adet bağımsız bölüm bulunmaktadır.`);
}

function isNormalBuildingFloor(floorName) {
  return /normal/i.test(String(floorName || ""));
}

function appendBuildingFloorSummaryPart(parts, piece) {
  const text = cleanComparablePunctuation(piece);
  if (text && !parts.includes(text)) parts.push(text);
}

function joinBuildingUnitCounts(values) {
  const parts = buildingFloorUnitColumns
    .map((column, index) => {
      if (!column.numeric || values[index] <= 0) return "";
      return `${values[index]} adet ${formatBuildingUnitLabel(column.label)}`;
    })
    .filter(Boolean);
  return joinTurkishList(parts);
}

function writeBuildingNormalGroup(rowParts, rows, start, end, count, label) {
  if (start < 0 || end < start || count <= 0) return;
  const unitLabel = formatBuildingUnitLabel(label);
  const span = end - start + 1;
  if (span === 1) {
    appendBuildingFloorSummaryPart(rowParts[start], `${formatBuildingFloorLocative(rows[start].floorName)} ${count} adet ${unitLabel}`);
    return;
  }
  if (span === 2) {
    appendBuildingFloorSummaryPart(
      rowParts[start],
      `${formatBuildingFloorNameForList(rows[start].floorName)} ve ${formatBuildingFloorLocative(rows[end].floorName)} ${count}${getBuildingDistributionSuffix(count)} ${unitLabel}`,
    );
    return;
  }
  const ordinals = [];
  for (let index = start; index <= end; index += 1) {
    ordinals.push(extractBuildingFloorOrdinal(rows[index].floorName));
  }
  appendBuildingFloorSummaryPart(
    rowParts[start],
    `${formatOrdinalList(ordinals)} normal katlarda ${count}${getBuildingDistributionSuffix(count)} ${unitLabel}`,
  );
}

function formatBuildingFloorLocative(floorName) {
  const name = formatBuildingFloorNameForList(floorName);
  if (!name) return "";
  if (/kat$/i.test(name)) return `${name}ta`;
  return `${name} katta`;
}

function formatBuildingFloorNameForList(floorName) {
  return String(floorName || "")
    .trim()
    .replace(/\bNormal\b/g, "normal")
    .replace(/\bBodrum\b/g, "bodrum")
    .replace(/\bZemin\b/g, "zemin")
    .replace(/\bAsma\b/g, "asma")
    .replace(/\bAra\b/g, "ara")
    .replace(/\bÇatı\b/g, "çatı")
    .replace(/\bTeras\b/g, "teras");
}

function extractBuildingFloorOrdinal(floorName) {
  const match = String(floorName || "").match(/^\s*(\d+)\./);
  return match ? `${match[1]}.` : formatBuildingFloorNameForList(floorName);
}

function formatOrdinalList(values) {
  return values.filter(Boolean).join(", ");
}

function formatBuildingUnitLabel(label) {
  return String(label || "").trim().toLocaleLowerCase("tr-TR");
}

function getBuildingDistributionSuffix(count) {
  return Number(count) === 2 ? " şer" : " er";
}

function joinTurkishList(items) {
  const clean = items.filter(Boolean);
  if (clean.length <= 1) return clean[0] || "";
  return `${clean.slice(0, -1).join(", ")} ve ${clean[clean.length - 1]}`;
}

const unitEntrancePositionOptions = ["", "Sağ", "Sağ Ön", "Sağ Arka", "Sol", "Sol Ön", "Sol Arka", "Ön", "Arka"];
const unitUsageStatusOptions = ["", "Boş (Hiç Kullanılmamış)", "Boş (Kullanılmış)", "Mal Sahibi", "Kiracı", "İşgalci"];
const unitFacadeOptions = ["Kuzey", "Güney", "Doğu", "Batı"];
const unitConstructionLevelOptions = Array.from({ length: 101 }, (_, index) => `${100 - index}%`);
const unitViewStatusOptions = ["", "Manzara Yok", "Geniş Deniz Manzarası", "Kısmi Deniz Manzarası", "Orman Manzarası", "Şehir Manzarası"];
const unitHeatingOptions = [
  "",
  "Doğalgaz Kombi",
  "Yerden Isıtma Doğalgaz Kombi",
  "Klima",
  "Merkezi Sistem",
  "Merkezi Sistem Isı Pay Ölçer",
  "Katı Yakıtlı Soba",
];
const unitFloorOptions = [
  "",
  "7. Bodrum",
  "6. Bodrum",
  "5. Bodrum",
  "4. Bodrum",
  "3. Bodrum",
  "2. Bodrum",
  "1. Bodrum",
  "Zemin",
  "Asma",
  "Ara",
  ...Array.from({ length: 40 }, (_, index) => `${index + 1}. Normal`),
  "Çatı",
  "Teras",
];
const unitInteriorFeatureFields = [
  { key: "unitInteriors", label: "İç Hacimler" },
];
const unitInteriorValidationOptions = [
  "Salon",
  "Oda",
  "2 Oda",
  "3 Oda",
  "4 Oda",
  "5 Oda",
  "Giyinme Odası",
  "Antre-Hol",
  "Mutfak",
  "Banyo",
  "WC",
  "Duş",
  "Balkon",
  "2 Balkon",
  "3 Balkon",
  "4 Balkon",
  "Teras",
  "2 Teras",
  "Veranda",
  "Kiler",
  "Depo",
  "Su Deposu",
  "Pompa Odası",
  "Sığınak",
  "Çamaşırlık",
  "Kömürlük",
  "Otopark",
];
const unitDecorativeFields = [
  { key: "unitWindows", label: "Pencereler", options: ["", "PVC", "Alüminyum", "Ahşap", "Çelik", "Isıcamlı", "Yok"] },
  { key: "unitExteriorDoor", label: "Dış Kapı", options: ["", "Çelik", "Ahşap", "Lake", "Camlı Alüminyum", "Demir Doğrama", "Yok"] },
  { key: "unitInteriorDoors", label: "İç Kapılar", options: ["", "Lake", "Amerikan Panel", "Ahşap", "PVC", "Yok"] },
  { key: "unitKitchenCabinet", label: "Mutfak Dolabı", options: ["", "Akrilik", "Lake", "Membran", "MDF Lam", "Yok"] },
  { key: "unitKitchenCounter", label: "Mutfak Tezgahı", options: ["", "Çimston", "Granit", "Mermer", "Laminat", "Yok"] },
  { key: "unitSalonFloor", label: "Salon Zemin", options: ["", "Laminant Parke", "Seramik", "Mermer", "Ahşap Parke", "Şap"] },
  { key: "unitSalonWall", label: "Salon Duvar", options: ["", "Alçı Sıva Üzeri Saten Boya", "Plastik Boya", "Duvar Kağıdı", "Sıvasız"] },
  { key: "unitRoomFloor", label: "Oda Zemin", options: ["", "Laminant Parke", "Seramik", "Mermer", "Ahşap Parke", "Şap"] },
  { key: "unitRoomWall", label: "Oda Duvar", options: ["", "Alçı Sıva Üzeri Saten Boya", "Plastik Boya", "Duvar Kağıdı", "Sıvasız"] },
  { key: "unitHallFloor", label: "Antre-Hol Zemin", options: ["", "Seramik", "Laminant Parke", "Mermer", "Granit"] },
  { key: "unitKitchenFloor", label: "Mutfak Zemin", options: ["", "Seramik", "Laminant Parke", "Mermer", "Granit"] },
  { key: "unitKitchenWall", label: "Mutfak Duvar", options: ["", "Fayans", "Seramik", "Alçı Sıva Üzeri Boya", "Plastik Boya"] },
  { key: "unitWetFloor", label: "Islak Hacim Zemin", options: ["", "Seramik", "Fayans", "Mermer", "Granit"] },
  { key: "unitWetWall", label: "Islak Hacim Duvar", options: ["", "Fayans", "Seramik", "Plastik Boya", "Sıvasız"] },
  { key: "unitBalconyFloor", label: "Balkon", options: ["", "Seramik", "Fayans", "Beton", "Plastik Boya"] },
  { key: "unitBathroomFixtures", label: "Banyo Vitrifiye Elemanları", options: ["", "Hilton Lavabo, Klozet, Duşakabin", "Lavabo, Klozet, Duşakabin", "Lavabo, Alaturka Tuvalet", "Yok"] },
  { key: "unitMaterialQuality", label: "Malzeme ve İşçilik Kalitesi", options: ["", "Kaliteli", "Orta", "Düşük", "Eksik imalatlı"] },
];

const unitFloorMaterialOptions = ["", "Laminant Parke", "Seramik", "Fayans", "Lamine Parke", "Ahşap Parke", "Mermer", "Granit", "Porselen Karo", "PVC / Vinil", "Epoksi", "Beton", "Şap"];
const unitWallMaterialOptions = ["", "Alçı Sıva Üzeri Saten Boya", "Plastik Boya", "Seramik", "Fayans", "Duvar Kağıdı", "Ahşap Kaplama", "Dekoratif Taş Kaplama", "Sıvalı", "Sıvasız"];
const unitKitchenCabinetOptions = ["", "MDF Lam", "Lake", "Membran", "Akrilik", "High Gloss", "Laminat", "Ahşap", "Suntalam", "Yok"];
const unitKitchenCounterOptions = ["", "Çimstone / Kuvars", "Granit", "Mermer", "Porselen", "Akrilik / Corian", "Laminat", "Mermerit", "Paslanmaz Çelik", "Yok"];
const unitBathroomFixtureOptions = ["", "Lavabo", "Klozet", "Hilton Lavabo", "Duşakabin", "Duş Teknesi", "Asma Klozet", "Küvet", "Alaturka Tuvalet", "Banyo Dolabı", "Yok"];
const unitMaterialQualityOptions = ["", "Lüks", "Kaliteli", "Orta", "Vasat (Kısmi Tadilat İhtiyacı)", "Kötü (Kapsamlı Tadilat İhtiyacı)"];
const unitDecorativeGroups = [
  {
    title: "Kapı, Pencere ve Mutfak",
    fields: [
      { key: "unitWindows", label: "Pencereler", options: ["", "PVC", "Isıcamlı PVC", "Alüminyum", "Isıcamlı Alüminyum", "Ahşap", "Demir Doğrama", "Yok"] },
      { key: "unitExteriorDoor", label: "Dış Kapı", options: ["", "Çelik", "Ahşap Kaplama Çelik", "Camlı Alüminyum", "Demir Doğrama", "Ferforje", "Ahşap", "Yok"] },
      { key: "unitInteriorDoors", label: "İç Kapılar", options: ["", "Lake", "Amerikan Panel", "Ahşap", "PVC", "Laminat", "Melamin", "Yok"] },
      { key: "unitKitchenCabinet", label: "Mutfak Dolabı", options: unitKitchenCabinetOptions },
      { key: "unitKitchenCounter", label: "Mutfak Tezgahı", options: unitKitchenCounterOptions },
      { key: "unitMaterialQuality", label: "Malzeme ve İşçilik Kalitesi", options: unitMaterialQualityOptions },
    ],
  },
  {
    title: "Salon, Oda, Antre-Hol ve Mutfak",
    fields: [
      { key: "unitSalonFloor", label: "Salon Zemin", options: unitFloorMaterialOptions },
      { key: "unitSalonWall", label: "Salon Duvar", options: unitWallMaterialOptions },
      { key: "unitRoomFloor", label: "Oda Zemin", options: unitFloorMaterialOptions },
      { key: "unitRoomWall", label: "Oda Duvar", options: unitWallMaterialOptions },
      { key: "unitHallFloor", label: "Antre-Hol Zemin", options: unitFloorMaterialOptions },
      { key: "unitHallWall", label: "Antre-Hol Duvar", options: unitWallMaterialOptions },
      { key: "unitKitchenFloor", label: "Mutfak Zemin", options: unitFloorMaterialOptions },
      { key: "unitKitchenWall", label: "Mutfak Duvar", options: unitWallMaterialOptions },
    ],
  },
  {
    title: "Islak Hacimler, Balkon ve Vitrifiye",
    fields: [
      { key: "unitWetFloor", label: "Islak Hacim Zemin", options: unitFloorMaterialOptions },
      { key: "unitWetWall", label: "Islak Hacim Duvar", options: unitWallMaterialOptions },
      { key: "unitBalconyFloor", label: "Balkon Zemin", options: unitFloorMaterialOptions },
      { key: "unitBalconyWall", label: "Balkon Duvar", options: unitWallMaterialOptions },
      { key: "unitBathroomFixture1", label: "Banyo Vitrifiye 1", options: unitBathroomFixtureOptions },
      { key: "unitBathroomFixture2", label: "Banyo Vitrifiye 2", options: unitBathroomFixtureOptions },
      { key: "unitBathroomFixture3", label: "Banyo Vitrifiye 3", options: unitBathroomFixtureOptions },
    ],
  },
];
const unitWallFloorRows = [
  { label: "Salon", floorKey: "unitSalonFloor", wallKey: "unitSalonWall" },
  { label: "Oda", floorKey: "unitRoomFloor", wallKey: "unitRoomWall" },
  { label: "Antre-Hol", floorKey: "unitHallFloor", wallKey: "unitHallWall" },
  { label: "Mutfak", floorKey: "unitKitchenFloor", wallKey: "unitKitchenWall" },
  { label: "Islak Hacimler", floorKey: "unitWetFloor", wallKey: "unitWetWall" },
  { label: "Balkon", floorKey: "unitBalconyFloor", wallKey: "unitBalconyWall" },
];
const unitGeneralDecorativeFields = [
  { key: "unitWindows", label: "Pencereler", options: ["", "PVC", "Isıcamlı PVC", "Alüminyum", "Isıcamlı Alüminyum", "Ahşap", "Demir Doğrama", "Yok"] },
  { key: "unitExteriorDoor", label: "Dış Kapı", options: ["", "Çelik", "Ahşap Kaplama Çelik", "Camlı Alüminyum", "Demir Doğrama", "Ferforje", "Ahşap", "Yok"] },
  { key: "unitInteriorDoors", label: "İç Kapılar", options: ["", "Lake", "Amerikan Panel", "Ahşap", "PVC", "Laminat", "Melamin", "Yok"] },
  { key: "unitKitchenCabinet", label: "Mutfak Dolabı", options: unitKitchenCabinetOptions },
  { key: "unitKitchenCounter", label: "Mutfak Tezgahı", options: unitKitchenCounterOptions },
  { key: "unitMaterialQuality", label: "Malzeme ve İşçilik Kalitesi", options: unitMaterialQualityOptions },
];
const unitBathroomFixtureFields = [
  { key: "unitBathroomFixture1", label: "Vitrifiye 1", options: unitBathroomFixtureOptions },
  { key: "unitBathroomFixture2", label: "Vitrifiye 2", options: unitBathroomFixtureOptions },
  { key: "unitBathroomFixture3", label: "Vitrifiye 3", options: unitBathroomFixtureOptions },
];

function createUnitFeaturesEditor() {
  const wrapper = document.createElement("div");
  wrapper.className = "unit-features-editor";
  const panels = [
    createUnitGeneralPanel(),
    createUnitAreaInteriorPanel(),
  ];
  if (!shouldHideUnitDecorativePanel()) {
    panels.push(createUnitDecorativePanel());
  }
  wrapper.append(...panels);
  return wrapper;
}

function shouldHideUnitDecorativePanel() {
  return isExternalAppointmentType(state.fields.appointmentType) || Boolean(state.fields.externalAppraisalReason);
}

function isExternalAppointmentType(value) {
  const appointmentType = normalizeSearchText(value || "");
  return appointmentType.includes("disar");
}

function createUnitGeneralPanel() {
  const panel = createUnitSubsection("Bağımsız Bölüm Genel Bilgileri", "Bina girişine göre konum, cephe, seviye, manzara ve ısınma bilgileri burada seçilir.");
  const grid = document.createElement("div");
  grid.className = "unit-general-grid";
  grid.append(
    createUnitSelectField("Kullanım Durumu", "unitUsageStatus", unitUsageStatusOptions),
    createUnitSelectField("Projeye Göre B. Bölümün Bina Girişine Göre Konumu", "unitEntrancePosition", unitEntrancePositionOptions),
    createUnitFacadeControl(),
    createUnitSelectField("İnşaat Seviye", "unitConstructionLevel", unitConstructionLevelOptions),
    createUnitSelectField("Manzara Var mı?", "unitViewStatus", unitViewStatusOptions),
    createUnitHeatingControl(),
  );
  panel.append(grid);
  return panel;
}

function createUnitAreaInteriorPanel() {
  const panel = createUnitSubsection("Katlar, Alanlar ve İç Hacimler", "Bağımsız bölüm birden fazla kattan oluşuyorsa her katı ayrı satır olarak ekleyiniz.");
  migrateLegacyUnitFloorFields();
  const toolbar = document.createElement("div");
  toolbar.className = "unit-floor-toolbar";
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "secondary-button";
  addButton.textContent = "Kat ekle";
  addButton.addEventListener("click", () => {
    const rows = getUnitFloorRows();
    rows.push(createEmptyUnitFloorRow());
    setUnitFloorRows(rows);
    renderSection();
  });
  toolbar.append(addButton);
  panel.append(toolbar, createUnitFloorInteriorRows(), createUnitInteriorDescriptionField());
  return panel;
}

function migrateLegacyUnitFloorFields() {
  if (Array.isArray(state.tables.unitFloors)) return;
  const rows = getUnitFloorRows();
  if (!rows.length) return;
  if (!state.tables) state.tables = {};
  state.tables.unitFloors = rows;
  syncUnitFloorSummaryFields(rows);
  autosave();
}

function createUnitFloorInteriorRows() {
  const rows = getUnitFloorRows();
  const wrapper = document.createElement("div");
  wrapper.className = "unit-floor-rows";
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-table-note";
    empty.textContent = "Henüz kat eklenmedi. Kat ekle düğmesi ile bağımsız bölüm katlarını oluşturun.";
    wrapper.append(empty);
    return wrapper;
  }

  rows.forEach((row, index) => {
    const card = document.createElement("div");
    card.className = "unit-floor-card";
    const head = document.createElement("div");
    head.className = "unit-floor-card-head";
    head.append(
      createUnitFloorRowSelect(index, "floor", "Kat", unitFloorOptions),
      createUnitFloorRowInput(index, "legalArea", "Yasal Alan"),
      createUnitFloorRowInput(index, "currentArea", "Mevcut Alan"),
      createUnitFloorRowInput(index, "legalTerrace", "Yasal Teras"),
      createUnitFloorRowInput(index, "currentTerrace", "Mevcut Teras"),
      createUnitFloorDeleteButton(index),
    );

    const note = createUnitFloorRowTextarea(index, "note", "Kat Açıklaması");
    head.append(createUnitFloorInteriorPicker(index));
    card.append(head, note);
    wrapper.append(card);
  });
  return wrapper;
}

function createEmptyUnitFloorRow() {
  return {
    floor: "",
    legalArea: "",
    currentArea: "",
    legalTerrace: "",
    currentTerrace: "",
    interiors: "",
    note: "",
  };
}

function getUnitFloorRows() {
  if (Array.isArray(state.tables.unitFloors)) return state.tables.unitFloors;
  const legacyHasData = ["unitFloor", "legalArea", "currentArea", "unitLegalTerrace", "unitCurrentTerrace", ...unitInteriorFeatureFields.map((field) => field.key)]
    .some((key) => String(state.fields[key] || "").trim());
  if (!legacyHasData) return [];
  return [{
    ...createEmptyUnitFloorRow(),
    floor: state.fields.unitFloor || "",
    legalArea: state.fields.legalArea || "",
    currentArea: state.fields.currentArea || "",
    legalTerrace: state.fields.unitLegalTerrace || "",
    currentTerrace: state.fields.unitCurrentTerrace || "",
    interiors: [
      state.fields.unitLivingRoom,
      state.fields.unitRoomCount,
      state.fields.unitKitchen,
      state.fields.unitBathroom,
      state.fields.unitBalcony,
      state.fields.unitWc,
      state.fields.unitHall,
      state.fields.unitDressingRoom,
      state.fields.unitLaundryRoom,
    ].filter(Boolean).join(", "),
    note: state.fields.interiorFeatures || "",
  }];
}

function setUnitFloorRows(rows) {
  if (!state.tables) state.tables = {};
  state.tables.unitFloors = rows;
  syncUnitFloorSummaryFields(rows);
  updateUnitInteriorDescription();
  autosave();
  renderValidation();
  updateStatus();
}

function syncUnitFloorSummaryFields(rows = getUnitFloorRows()) {
  const first = rows[0] || {};
  state.fields.unitFloor = first.floor || "";
  state.fields.legalArea = first.legalArea || "";
  state.fields.currentArea = first.currentArea || "";
  state.fields.unitLegalTerrace = first.legalTerrace || "";
  state.fields.unitCurrentTerrace = first.currentTerrace || "";
  state.fields.interiorFeatures = formatUnitFloorInteriorSummary(rows);
}

function formatUnitFloorInteriorSummary(rows = []) {
  return rows.map((row) => {
    const floor = row.floor || "Kat";
    const parts = String(row.interiors || "").split(",").map((item) => item.trim()).filter(Boolean);
    return [floor, parts.join(", "), row.note].filter(Boolean).join(": ");
  }).filter(Boolean).join("\n");
}

function updateUnitFloorRow(index, key, value) {
  const rows = getUnitFloorRows();
  if (!rows[index]) return;
  rows[index][key] = value;
  setUnitFloorRows(rows);
  updateUnitDecorativeDescription();
}

function createUnitInteriorDescriptionField() {
  updateUnitInteriorDescription();
  const label = createUnitFieldShell("Bağımsız Bölüm İç Hacimler Açıklaması", "unitInteriorDescription");
  label.classList.add("field-wide", "unit-interior-description-field");
  const textarea = document.createElement("textarea");
  textarea.dataset.field = "unitInteriorDescription";
  textarea.value = state.fields.unitInteriorDescription || "";
  textarea.addEventListener("input", (event) => {
    state.fields.unitInteriorDescription = event.target.value;
    state.fields.unitInteriorDescriptionManual = "Evet";
    autosave();
  });
  textarea.addEventListener("blur", () => {
    const formattedValue = normalizeReportDescriptionText(textarea.value);
    textarea.value = formattedValue;
    state.fields.unitInteriorDescription = formattedValue;
    autosave();
    renderValidation();
    updateStatus();
  });

  const actions = document.createElement("div");
  actions.className = "unit-decorative-actions";
  const regenerate = document.createElement("button");
  regenerate.type = "button";
  regenerate.className = "secondary-button";
  regenerate.textContent = "Metni yeniden oluştur";
  regenerate.addEventListener("click", () => {
    state.fields.unitInteriorDescriptionManual = "";
    updateUnitInteriorDescription(true);
    autosave();
    renderSection();
  });
  actions.append(regenerate);
  label.append(textarea, actions);
  return label;
}

function updateUnitInteriorDescription(force = false) {
  if (!force && state.fields.unitInteriorDescriptionManual === "Evet") return;
  const text = composeUnitInteriorDescription();
  state.fields.unitInteriorDescription = text;
  const activeTextarea = document.querySelector("[data-field='unitInteriorDescription']");
  if (activeTextarea) activeTextarea.value = text;
}

function composeUnitInteriorDescription() {
  const rows = getUnitFloorRows()
    .map((row) => normalizeUnitFloorDescriptionRow(row))
    .filter((row) => row.floor || row.legalArea || row.currentArea || row.legalTerrace || row.currentTerrace || row.interiorText);
  if (!rows.length) return "";

  if (rows.length === 1) {
    return normalizeReportDescriptionText(composeSingleUnitFloorInteriorParagraph(rows[0]));
  }

  const floorSentences = rows
    .map((row) => composeMultiUnitFloorInteriorSentence(row))
    .filter(Boolean);
  const legalTotal = rows.reduce((sum, row) => sum + (Number.isFinite(row.legalAreaNumber) ? row.legalAreaNumber : 0), 0);
  const currentTotal = rows.reduce((sum, row) => sum + (Number.isFinite(row.currentAreaNumber) ? row.currentAreaNumber : 0), 0);
  const legalTerraceTotal = rows.reduce((sum, row) => sum + (Number.isFinite(row.legalTerraceNumber) ? row.legalTerraceNumber : 0), 0);
  const currentTerraceTotal = rows.reduce((sum, row) => sum + (Number.isFinite(row.currentTerraceNumber) ? row.currentTerraceNumber : 0), 0);
  const hasTerrace = legalTerraceTotal > 0 || currentTerraceTotal > 0;

  const totalSentences = [];
  if (legalTotal > 0 || currentTotal > 0) {
    totalSentences.push(legalTotal === currentTotal
      ? `Taşınmaz projesine ve mevcut duruma göre toplam ${formatUnitAreaText(legalTotal)} kullanım alanına sahiptir.`
      : `Taşınmaz yasal olarak toplam ${formatUnitAreaText(legalTotal)}, mevcut olarak toplam ${formatUnitAreaText(currentTotal)} kullanım alanına sahiptir.`);
  }
  if (hasTerrace) {
    totalSentences.push(composeUnitTerraceTotalSentence(legalTerraceTotal, currentTerraceTotal));
    totalSentences.push("Teras alanları değer artırıcı faktör olarak değerlendirilmiştir.");
  }

  return normalizeReportDescriptionText([...floorSentences, ...totalSentences].join(" "));
}

function normalizeUnitFloorDescriptionRow(row = {}) {
  const legalAreaNumber = parseReportNumber(row.legalArea);
  const currentAreaNumber = parseReportNumber(row.currentArea);
  const legalTerraceNumber = parseReportNumber(row.legalTerrace);
  const currentTerraceNumber = parseReportNumber(row.currentTerrace);
  return {
    floor: normalizeReportTitleText(row.floor || ""),
    legalArea: row.legalArea || "",
    currentArea: row.currentArea || "",
    legalTerrace: row.legalTerrace || "",
    currentTerrace: row.currentTerrace || "",
    legalAreaNumber,
    currentAreaNumber,
    legalTerraceNumber,
    currentTerraceNumber,
    interiorText: buildUnitInteriorTextForRow(row.interiors),
  };
}

function composeSingleUnitFloorInteriorParagraph(row) {
  const legalArea = formatUnitAreaText(row.legalAreaNumber);
  const currentArea = formatUnitAreaText(row.currentAreaNumber || row.legalAreaNumber);
  const parts = [];
  if (row.legalAreaNumber > 0 || row.currentAreaNumber > 0) {
    const interiorClause = row.interiorText
      ? ` kullanım alanına sahip olup, ${row.interiorText} hacimlerinden oluşmaktadır.`
      : " kullanım alanına sahiptir.";
    parts.push(row.legalAreaNumber === row.currentAreaNumber || !row.currentAreaNumber
      ? `Taşınmaz projesine ve mevcut duruma göre ${legalArea}${interiorClause}`
      : `Taşınmaz projesine göre ${legalArea}, mevcut durumda ${currentArea}${interiorClause}`);
  } else if (row.interiorText) {
    parts.push(`Taşınmaz ${row.interiorText} hacimlerinden oluşmaktadır.`);
  }
  parts.push(composeUnitTerraceSentence(row));
  return parts.filter(Boolean).join(" ");
}

function composeMultiUnitFloorInteriorSentence(row) {
  const legalArea = formatUnitAreaText(row.legalAreaNumber);
  const currentArea = formatUnitAreaText(row.currentAreaNumber || row.legalAreaNumber);
  const legalTerrace = row.legalTerraceNumber > 0 ? ` (Teras: ${formatUnitAreaText(row.legalTerraceNumber)})` : "";
  const currentTerrace = row.currentTerraceNumber > 0 ? ` (Teras: ${formatUnitAreaText(row.currentTerraceNumber)})` : "";
  const floor = formatUnitFloorNameForSentence(row.floor);
  const interiorClause = row.interiorText
    ? ` kullanım alanına sahip olup, projesine göre ${row.interiorText} iç hacimlerinden oluşmaktadır.`
    : " kullanım alanına sahiptir.";
  if (row.legalAreaNumber > 0 || row.currentAreaNumber > 0) {
    if (row.legalAreaNumber === row.currentAreaNumber || !row.currentAreaNumber) {
      return `${floor} projesine ve mevcut duruma göre ${legalArea}${legalTerrace}${interiorClause}`;
    }
    return `${floor} projesine göre ${legalArea}${legalTerrace}, mevcut durumda ${currentArea}${currentTerrace}${interiorClause}`;
  }
  if (row.interiorText) return `${floor} ${row.interiorText} iç hacimlerinden oluşmaktadır.`;
  return "";
}

function formatUnitFloorNameForSentence(value) {
  const floor = normalizeReportTitleText(value || "").trim();
  if (!floor) return "İlgili Kat";
  if (/\bkat\b/i.test(floor.toLocaleLowerCase("tr-TR"))) return floor;
  return `${floor} Kat`;
}

function composeUnitTerraceSentence(row) {
  const legal = row.legalTerraceNumber;
  const current = row.currentTerraceNumber;
  if (!(legal > 0) && !(current > 0)) return "";
  if (legal === current) {
    return `Taşınmazın ${formatUnitAreaText(legal)} yasal ve mevcut teras alanı bulunmaktadır. Teras alanları kullanım alanına dahil edilmemiş olup, değer artırıcı faktör olarak dikkate alınmıştır.`;
  }
  return `Taşınmazın ${formatUnitAreaText(legal)} yasal teras ve ${formatUnitAreaText(current)} mevcut teras alanı bulunmaktadır. Teras alanları kullanım alanına dahil edilmemiş olup, değer artırıcı faktör olarak değerlendirilmiştir.`;
}

function composeUnitTerraceTotalSentence(legalTotal, currentTotal) {
  if (legalTotal > 0 && currentTotal > 0) {
    if (legalTotal === currentTotal) {
      return `Taşınmaz toplam ${formatUnitAreaText(legalTotal)} yasal ve mevcut teras alanına sahiptir.`;
    }
    return `Ayrıca taşınmaz toplam ${formatUnitAreaText(legalTotal)} yasal teras ve ${formatUnitAreaText(currentTotal)} mevcut teras alanına sahiptir.`;
  }
  if (legalTotal > 0) return `Ayrıca taşınmaz toplam ${formatUnitAreaText(legalTotal)} yasal teras alanına sahiptir.`;
  return `Ayrıca taşınmaz toplam ${formatUnitAreaText(currentTotal)} mevcut teras alanına sahiptir.`;
}

function buildUnitInteriorTextForRow(value) {
  const counts = new Map();
  const explicit = new Map();
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const parsed = parseUnitInteriorItem(item);
      if (!parsed.name) return;
      counts.set(parsed.name, (counts.get(parsed.name) || 0) + parsed.count);
      explicit.set(parsed.name, Boolean(explicit.get(parsed.name) || parsed.explicit));
    });
  const ordered = [];
  unitInteriorParagraphOrder.forEach((name) => {
    if (!counts.has(name)) return;
    ordered.push(formatUnitInteriorCount(name, counts.get(name), explicit.get(name)));
  });
  [...counts.keys()].forEach((name) => {
    if (unitInteriorParagraphOrder.includes(name)) return;
    ordered.push(formatUnitInteriorCount(name, counts.get(name), explicit.get(name)));
  });
  return formatTurkishList(ordered);
}

const unitInteriorParagraphOrder = [
  "antre",
  "hol",
  "antre-hol",
  "salon",
  "oda",
  "mutfak",
  "banyo",
  "wc",
  "duş",
  "balkon",
  "teras",
  "veranda",
  "kiler",
  "depo",
  "su deposu",
  "pompa odası",
  "sığınak",
  "çamaşırlık",
  "kömürlük",
  "otopark",
  "giyinme odası",
];

function parseUnitInteriorItem(value) {
  const text = normalizeReportTitleText(value || "").replace(/,$/, "").trim();
  const match = text.match(/^(\d+)\s+(.+)$/);
  if (match) return { count: Number.parseInt(match[1], 10) || 1, name: normalizeUnitInteriorName(match[2]), explicit: true };
  return { count: 1, name: normalizeUnitInteriorName(text), explicit: false };
}

function normalizeUnitInteriorName(value) {
  const key = String(value || "").trim().toLocaleLowerCase("tr-TR");
  if (key === "antre hol") return "antre-hol";
  return key;
}

function formatUnitInteriorCount(name, count, explicit) {
  if (count === 1 && !explicit) return name;
  return `${count} ${name}`;
}

function formatUnitAreaText(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "0 m2";
  return `${number.toLocaleString("tr-TR", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  })} m2`;
}

function createUnitFloorRowSelect(index, key, labelText, options) {
  const label = document.createElement("label");
  label.className = "field";
  const select = document.createElement("select");
  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = getUnitFloorRows()[index]?.[key] || "";
  select.addEventListener("input", (event) => updateUnitFloorRow(index, key, event.target.value));
  label.append(createSpan(labelText), select);
  return label;
}

function createUnitFloorRowInput(index, key, labelText) {
  const label = document.createElement("label");
  label.className = "field";
  const input = document.createElement("input");
  input.type = "text";
  input.value = getUnitFloorRows()[index]?.[key] || "";
  input.addEventListener("input", (event) => updateUnitFloorRow(index, key, event.target.value));
  input.addEventListener("blur", () => {
    const formattedValue = normalizeReportFieldValue(key, input.value);
    if (formattedValue !== input.value) {
      input.value = formattedValue;
      updateUnitFloorRow(index, key, formattedValue);
    }
  });
  label.append(createSpan(labelText), input);
  return label;
}

function createUnitFloorRowTextarea(index, key, labelText) {
  const label = document.createElement("label");
  label.className = "field field-wide";
  const textarea = document.createElement("textarea");
  textarea.value = getUnitFloorRows()[index]?.[key] || "";
  textarea.addEventListener("input", (event) => updateUnitFloorRow(index, key, event.target.value));
  textarea.addEventListener("blur", () => {
    const formattedValue = normalizeReportDescriptionText(textarea.value);
    if (formattedValue !== textarea.value) {
      textarea.value = formattedValue;
      updateUnitFloorRow(index, key, formattedValue);
    }
  });
  label.append(createSpan(labelText), textarea);
  return label;
}

function createUnitFloorInteriorPicker(index) {
  const label = document.createElement("div");
  label.className = "field field-wide unit-floor-interior-picker";
  const selected = String(getUnitFloorRows()[index]?.interiors || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const list = document.createElement("div");
  list.className = "unit-interior-validation-list";
  Array.from({ length: 10 }, (_, selectIndex) => {
    const select = document.createElement("select");
    select.dataset.unitInteriorSelect = String(selectIndex);
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Seçiniz";
    select.append(empty);
    unitInteriorValidationOptions.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      select.append(item);
    });
    select.value = selected[selectIndex] || "";
    select.addEventListener("input", () => {
      const values = [...list.querySelectorAll("[data-unit-interior-select]")]
        .map((item) => item.value)
        .filter(Boolean);
      updateUnitFloorRow(index, "interiors", values.join(", "));
    });
    list.append(select);
  });
  label.append(createSpan("İç Hacimler"), list);
  return label;
}

function createUnitFloorDeleteButton(index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "delete-row-button unit-floor-delete";
  button.textContent = "×";
  button.title = "Katı sil";
  button.addEventListener("click", () => {
    const rows = getUnitFloorRows();
    rows.splice(index, 1);
    setUnitFloorRows(rows);
    renderSection();
  });
  return button;
}

function createUnitDecorativePanel() {
  migrateUnitDecorativeFields();
  const panel = createUnitSubsection("Dekoratif Özellikler", "Duvar, zemin, kapı-pencere, mutfak, vitrifiye ve işçilik bilgileri makro mantığıyla gruplandırılır.");
  const wrapper = document.createElement("div");
  wrapper.className = "unit-decorative-groups";
  wrapper.append(
    createUnitWallFloorTable(),
    createUnitDecorativeFieldCard("Kapı, Pencere ve Mutfak", unitGeneralDecorativeFields),
    createUnitDecorativeFieldCard("Banyo Vitrifiye Elemanları", unitBathroomFixtureFields),
  );
  panel.append(wrapper, createUnitDecorativeDescriptionField());
  return panel;
}

function migrateUnitDecorativeFields() {
  if (!state.fields.unitHallWall && state.fields.unitRoomWall) {
    state.fields.unitHallWall = state.fields.unitRoomWall;
  }
  if (!state.fields.unitBalconyWall && state.fields.unitWetWall) {
    state.fields.unitBalconyWall = state.fields.unitWetWall;
  }
  if (state.fields.unitBathroomFixtures && !state.fields.unitBathroomFixture1 && !state.fields.unitBathroomFixture2 && !state.fields.unitBathroomFixture3) {
    const fixtures = String(state.fields.unitBathroomFixtures)
      .replace(/\s+ve\s+/gi, ",")
      .split(",")
      .map((item) => normalizeReportTitleText(item))
      .filter(Boolean);
    ["unitBathroomFixture1", "unitBathroomFixture2", "unitBathroomFixture3"].forEach((key, index) => {
      state.fields[key] = fixtures[index] || "";
    });
  }
}

function createUnitDecorativeFieldCard(titleText, fields) {
  const card = document.createElement("div");
  card.className = "unit-decorative-card";
  const title = document.createElement("h5");
  title.textContent = titleText;
  const grid = document.createElement("div");
  grid.className = "unit-decorative-grid";
  fields.forEach((field) => {
    grid.append(createUnitDecorativeSelectField(field.label, field.key, field.options));
  });
  card.append(title, grid);
  return card;
}

function createUnitWallFloorTable() {
  const card = document.createElement("div");
  card.className = "unit-decorative-card unit-wall-floor-card";
  const title = document.createElement("h5");
  title.textContent = "Duvar ve Zemin";
  const table = document.createElement("div");
  table.className = "unit-wall-floor-table";
  table.innerHTML = `
    <div class="unit-wall-floor-head">Grup</div>
    <div class="unit-wall-floor-head">Zemin</div>
    <div class="unit-wall-floor-head">Duvar</div>
  `;
  unitWallFloorRows.forEach((row) => {
    const group = document.createElement("div");
    group.className = "unit-wall-floor-group";
    group.textContent = row.label;
    table.append(
      group,
      createUnitDecorativeSelectOnly(row.floorKey, unitFloorMaterialOptions),
      createUnitDecorativeSelectOnly(row.wallKey, unitWallMaterialOptions),
    );
  });
  card.append(title, table);
  return card;
}

function getDecorativeOptionsWithCurrentValue(options, key) {
  const currentValue = state.fields[key] || "";
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }
  return [...options, currentValue];
}

function createUnitDecorativeSelectOnly(key, options) {
  const select = document.createElement("select");
  select.dataset.field = key;
  const optionValues = getDecorativeOptionsWithCurrentValue(options, key);
  optionValues.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = optionValues.includes(state.fields[key]) ? state.fields[key] : "";
  markFieldSourceState(select, key);
  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(key);
    state.fields[key] = event.target.value;
    updateUnitDecorativeDescription();
    autosave();
    renderValidation();
    updateStatus();
  });
  return select;
}

function createUnitDecorativeSelectField(labelText, key, options) {
  const label = createUnitFieldShell(labelText, key);
  const select = document.createElement("select");
  select.dataset.field = key;
  const optionValues = getDecorativeOptionsWithCurrentValue(options, key);
  optionValues.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = optionValues.includes(state.fields[key]) ? state.fields[key] : "";
  markFieldSourceState(select, key);
  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(key);
    state.fields[key] = event.target.value;
    updateUnitDecorativeDescription();
    autosave();
    renderValidation();
    updateStatus();
  });
  label.append(select);
  return label;
}

function createUnitDecorativeDescriptionField() {
  updateUnitDecorativeDescription();
  const label = createUnitFieldShell("Dekoratif Özellikler Açıklaması", "unitDecorativeDescription");
  label.classList.add("field-wide");
  const textarea = document.createElement("textarea");
  textarea.dataset.field = "unitDecorativeDescription";
  textarea.value = state.fields.unitDecorativeDescription || "";
  textarea.addEventListener("input", (event) => {
    state.fields.unitDecorativeDescription = event.target.value;
    state.fields.unitDecorativeDescriptionManual = "Evet";
    autosave();
  });
  textarea.addEventListener("blur", () => {
    const formattedValue = normalizeReportDescriptionText(textarea.value);
    textarea.value = formattedValue;
    state.fields.unitDecorativeDescription = formattedValue;
    autosave();
    renderValidation();
    updateStatus();
  });
  const actions = document.createElement("div");
  actions.className = "unit-decorative-actions";
  const regenerate = document.createElement("button");
  regenerate.type = "button";
  regenerate.className = "secondary-button";
  regenerate.textContent = "Metni yeniden oluştur";
  regenerate.addEventListener("click", () => {
    state.fields.unitDecorativeDescriptionManual = "";
    updateUnitDecorativeDescription(true);
    autosave();
    renderSection();
  });
  actions.append(regenerate);
  label.append(textarea, actions);
  return label;
}

function updateUnitDecorativeDescription(force = false) {
  if (!force && state.fields.unitDecorativeDescriptionManual === "Evet") return;
  const text = composeUnitDecorativeDescription();
  state.fields.unitDecorativeDescription = text;
  const activeTextarea = document.querySelector("[data-field='unitDecorativeDescription']");
  if (activeTextarea) activeTextarea.value = text;
}

function getUnitInteriorPresence() {
  const summary = formatUnitFloorInteriorSummary(getUnitFloorRows());
  const folded = foldTurkish(summary).toLocaleLowerCase("tr");
  const hasAny = Boolean(folded.trim());
  return {
    hasAny,
    salon: /\bsalon\b/.test(folded),
    oda: /\b\d*\s*oda\b|\boda\b/.test(folded),
    antreHol: /antre|hol/.test(folded),
    mutfak: /mutfak/.test(folded),
    wetArea: /banyo|wc|duş|dus/.test(folded),
    balcony: /balkon/.test(folded),
    terrace: /teras|veranda/.test(folded),
  };
}

function shouldUseInteriorDecorativeArea(presence, key, floorValue, wallValue) {
  if (!floorValue && !wallValue) return false;
  return !presence.hasAny || Boolean(presence[key]);
}

function hasWetAreaInterior(presence) {
  return !presence.hasAny || presence.wetArea;
}

function hasKitchenInterior(presence) {
  return !presence.hasAny || presence.mutfak;
}

function getOutdoorInteriorPrefix(presence) {
  if (!presence.hasAny) return "Balkon/teras bölümlerinde";
  if (presence.balcony && presence.terrace) return "Balkon ve teras bölümlerinde";
  if (presence.balcony) return "Balkon bölümünde";
  if (presence.terrace) return "Teras bölümünde";
  return "";
}

function composeUnitDecorativeDescription() {
  const presence = getUnitInteriorPresence();
  return normalizeReportDescriptionText(joinNonEmptySentences([
    composeMainRoomDecorativeSentence(presence),
    hasWetAreaInterior(presence) ? composeSingleAreaDecorativeSentence("Islak hacimlerde", state.fields.unitWetFloor, state.fields.unitWetWall) : "",
    getOutdoorInteriorPrefix(presence) ? composeSingleAreaDecorativeSentence(getOutdoorInteriorPrefix(presence), state.fields.unitBalconyFloor, state.fields.unitBalconyWall) : "",
    hasWetAreaInterior(presence) ? composeBathroomFixtureSentence() : "",
    composeDoorsWindowsSentence(),
    hasKitchenInterior(presence) ? composeKitchenCabinetCounterSentence() : "",
    composeMaterialQualitySentence(),
  ]));
}

function composeMainRoomDecorativeSentence(presence = getUnitInteriorPresence()) {
  const areas = [
    { key: "salon", name: "salon", floor: state.fields.unitSalonFloor, wall: state.fields.unitSalonWall },
    { key: "oda", name: "oda", floor: state.fields.unitRoomFloor, wall: state.fields.unitRoomWall },
    { key: "antreHol", name: "antre-hol", floor: state.fields.unitHallFloor, wall: state.fields.unitHallWall },
    { key: "mutfak", name: "mutfak", floor: state.fields.unitKitchenFloor, wall: state.fields.unitKitchenWall },
  ].filter((area) => shouldUseInteriorDecorativeArea(presence, area.key, area.floor, area.wall));
  const areaNames = areas.map((area) => area.name);
  const floorValues = areas.map((area) => area.floor);
  const wallValues = areas.map((area) => area.wall);
  const floorGroups = groupDecorativeAreasByValue(areaNames, floorValues);
  const commonWall = getMostCommonDecorativeValue(wallValues);
  if (!floorGroups.length && !commonWall) return "";
  const floorText = floorGroups.length
    ? `${floorGroups.map((group) => `${formatTurkishList(group.names)} zeminleri ${toLowerText(group.value)} kaplı`).join(", ")} vaziyette`
    : `${formatTurkishList(areaNames)} bölümlerinde`;
  const wallText = commonWall ? `duvarlar ${formatWallMaterialPhrase(commonWall)}` : "";
  return [floorText, wallText].filter(Boolean).join(" olup, ") + ".";
}

function composeSingleAreaDecorativeSentence(prefix, floorValue, wallValue) {
  const floor = normalizeDecorativeMaterial(floorValue);
  const wall = normalizeDecorativeMaterial(wallValue);
  if (!floor && !wall) return "";
  if (floor && wall && floor === wall) {
    return `${prefix} zeminler ve duvarlar ${toLowerText(floor)} kaplıdır.`;
  }
  if (floor && wall) {
    return `${prefix} zeminler ${toLowerText(floor)} kaplı, duvarlar ise ${formatWallMaterialPhrase(wall)}.`;
  }
  if (floor) return `${prefix} zeminler ${toLowerText(floor)} kaplıdır.`;
  return `${prefix} duvarlar ${formatWallMaterialPhrase(wall)}.`;
}

function composeBathroomFixtureSentence() {
  const fixtureValues = ["unitBathroomFixture1", "unitBathroomFixture2", "unitBathroomFixture3"]
    .map((key) => state.fields[key])
    .filter(Boolean);
  const fixtures = fixtureValues.filter((value) => !isNotInstalledDecorative(value));
  const missingCount = fixtureValues.filter(isNotInstalledDecorative).length;
  if (fixtureValues.length && missingCount === fixtureValues.length) {
    return "Banyoda vitrifiye elemanları montajı henüz yapılmamıştır.";
  }
  if (!fixtures.length) {
    return "Banyoda vitrifiye elemanları montajı henüz yapılmamıştır.";
  }
  const sentence = `Banyo bölümünde ${formatTurkishList(fixtures.map(toLowerText))} vitrifiye elemanları bulunmaktadır.`;
  if (missingCount) {
    return `${sentence} Seçilen diğer vitrifiye elemanlarının montajı henüz yapılmamıştır.`;
  }
  return sentence;
}

function composeDoorsWindowsSentence() {
  const exteriorDoor = state.fields.unitExteriorDoor || "";
  const interiorDoors = state.fields.unitInteriorDoors || "";
  const windows = state.fields.unitWindows || "";
  const exteriorMissing = isNotInstalledDecorative(exteriorDoor);
  const interiorMissing = isNotInstalledDecorative(interiorDoors);
  const windowMissing = isNotInstalledDecorative(windows);
  const parts = [];
  const missingParts = [];
  if (exteriorDoor && !exteriorMissing) parts.push(`dış kapısı ${formatDoorWindowMaterial(exteriorDoor)} kapı`);
  if (exteriorMissing) missingParts.push("dış kapı");
  if (interiorDoors && !interiorMissing) parts.push(`iç kapıları ${formatDoorWindowMaterial(interiorDoors)} kapı`);
  if (interiorMissing) missingParts.push("iç kapı");
  if (windows && !windowMissing) parts.push(`pencereleri ${formatDoorWindowMaterial(windows)} doğramadır`);
  if (windowMissing) missingParts.push("pencere");
  const sentences = [];
  if (parts.length) sentences.push(`Taşınmazın ${formatTurkishList(parts)}.`);
  if (missingParts.length) sentences.push(`Taşınmazda ${formatTurkishList(missingParts)} montajı henüz yapılmamıştır.`);
  return sentences.join(" ");
}

function composeKitchenCabinetCounterSentence() {
  const cabinet = state.fields.unitKitchenCabinet || "";
  const counter = state.fields.unitKitchenCounter || "";
  const cabinetMissing = isNotInstalledDecorative(cabinet);
  const counterMissing = isNotInstalledDecorative(counter);
  if (!cabinet && !counter) return "";
  if (cabinetMissing && counterMissing) return "Mutfak dolabı ve tezgahının montajı henüz yapılmamıştır.";
  if (!cabinetMissing && counterMissing) return `Mutfak dolapları ${ensureCabinetText(cabinet)} olup, mutfak tezgahının montajı henüz yapılmamıştır.`;
  if (cabinetMissing && !counterMissing) return `Mutfak tezgahı ${toLowerText(counter)} olup, mutfak dolabı montajı henüz yapılmamıştır.`;
  return `Mutfak dolapları ${ensureCabinetText(cabinet)} olup, mutfak tezgahı ${toLowerText(counter)} olarak düzenlenmiştir.`;
}

function composeMaterialQualitySentence() {
  const quality = state.fields.unitMaterialQuality || "";
  const folded = foldTurkish(quality);
  if (!quality) return "";
  if (folded.includes("LUKS")) return "Taşınmazın iç özellikleri lüks seviyede olup, tadilat ihtiyacı bulunmamaktadır.";
  if (folded.includes("KALITELI")) return "Taşınmazın iç özellikleri kaliteli seviyede olup, tadilat ihtiyacı bulunmamaktadır.";
  if (folded === "ORTA") return "Taşınmazın iç özellikleri standart seviyede olup, tadilat ihtiyacı bulunmamaktadır.";
  if (folded.includes("VASAT")) return "Taşınmazın iç özellikleri vasat seviyede olup, kısmi tadilat ihtiyacı bulunmaktadır.";
  if (folded.includes("KOTU")) return "Taşınmazın iç özellikleri kötü seviyede olup, kapsamlı tadilat ihtiyacı bulunmaktadır.";
  return "";
}

function hasUnitBalconyOrTerrace() {
  const text = formatUnitFloorInteriorSummary(getUnitFloorRows());
  return /balkon|teras/i.test(foldTurkish(text).toLocaleLowerCase("tr"));
}

function groupDecorativeAreasByValue(names, values) {
  const groups = [];
  names.forEach((name, index) => {
    const value = normalizeDecorativeMaterial(values[index]);
    if (!value) return;
    const group = groups.find((item) => item.value === value);
    if (group) {
      group.names.push(name);
    } else {
      groups.push({ value, names: [name] });
    }
  });
  return groups;
}

function getMostCommonDecorativeValue(values = []) {
  const counts = new Map();
  values.map(normalizeDecorativeMaterial).filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function normalizeDecorativeMaterial(value) {
  return normalizeReportTitleText(value || "")
    .replace(/\s+Kaplıdır$/i, "")
    .replace(/\s+Kaplı$/i, "")
    .replace(/\s+Boyalıdır$/i, "")
    .replace(/\s+Boyalı$/i, "")
    .trim();
}

function formatWallMaterialPhrase(value) {
  const text = toLowerText(value);
  if (!text) return "";
  if (text.endsWith("boya")) return `${text}lıdır`;
  if (/boyalı|kaplı|sıvalı|sıvasız/i.test(text)) return `${text}dır`;
  return `${text} kaplıdır`;
}

function formatDoorWindowMaterial(value) {
  const text = normalizeReportTitleText(value || "");
  return text.toLocaleUpperCase("tr") === "PVC" ? "PVC" : toLowerText(text);
}

function isNotInstalledDecorative(value) {
  return /^(yok)$/i.test(foldTurkish(value || "").trim()) || /henuz|henüz|takilmamis|takılmamış|yapilmamis|yapılmamış|montaj/i.test(foldTurkish(value || "").toLocaleLowerCase("tr"));
}

function ensureCabinetText(value) {
  const text = toLowerText(value);
  return text.includes("dolap") ? text : `${text} dolap`;
}

function toLowerText(value) {
  const text = normalizeReportTitleText(value || "");
  return text.toLocaleUpperCase("tr") === "PVC" ? "PVC" : text.toLocaleLowerCase("tr");
}

function joinNonEmptySentences(sentences = []) {
  return sentences.map((item) => String(item || "").trim()).filter(Boolean).join(" ");
}

function formatTurkishList(items = []) {
  const list = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (list.length <= 1) return list[0] || "";
  if (list.length === 2) return `${list[0]} ve ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} ve ${list.at(-1)}`;
}

function createUnitSubsection(title, description) {
  const panel = document.createElement("div");
  panel.className = "subsection is-detail unit-subsection";
  panel.innerHTML = `
    <div class="subsection-title-row">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
  return panel;
}

function createUnitSelectField(labelText, key, options, config = {}) {
  const label = createUnitFieldShell(labelText, key, config);
  const select = document.createElement("select");
  select.dataset.field = key;
  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  const defaultValue = key === "unitConstructionLevel" ? "100%" : "";
  if (key === "unitConstructionLevel" && !state.fields[key]) state.fields[key] = defaultValue;
  select.value = options.includes(state.fields[key]) ? state.fields[key] : defaultValue;
  attachUnitFieldEvents(select, key);
  label.append(select);
  return label;
}

function createUnitTextField(labelText, key, config = {}) {
  const label = createUnitFieldShell(labelText, key, config);
  const input = document.createElement("input");
  input.type = "text";
  input.dataset.field = key;
  input.value = state.fields[key] || "";
  attachUnitFieldEvents(input, key);
  label.append(input);
  return label;
}

function createUnitTextareaField(labelText, key, config = {}) {
  const label = createUnitFieldShell(labelText, key, config);
  const textarea = document.createElement("textarea");
  textarea.dataset.field = key;
  textarea.value = state.fields[key] || "";
  attachUnitFieldEvents(textarea, key);
  label.append(textarea);
  return label;
}

function createUnitFieldShell(labelText, key, config = {}) {
  const label = document.createElement("label");
  label.className = "field";
  label.classList.toggle("is-required", Boolean(config.required));
  label.classList.toggle("is-critical", Boolean(config.critical));
  label.classList.toggle("is-missing", Boolean(config.required) && !state.fields[key]);
  label.append(createSpan(labelText));
  return label;
}

function attachUnitFieldEvents(control, key) {
  markFieldSourceState(control, key);
  control.addEventListener("input", (event) => {
    clearFieldSourceOwnership(key);
    state.fields[key] = event.target.value;
    autosave();
    renderValidation();
    updateStatus();
  });
  control.addEventListener("blur", () => {
    const formattedValue = normalizeReportFieldValue(key, control.value);
    if (formattedValue === control.value) return;
    control.value = formattedValue;
    state.fields[key] = formattedValue;
    autosave();
    renderValidation();
    updateStatus();
  });
}

function createUnitFacadeControl() {
  const label = document.createElement("div");
  label.className = "field unit-facade-field";
  const selected = new Set(getMultiCheckboxValues("facades"));
  const list = document.createElement("div");
  list.className = "unit-inline-checkboxes";
  unitFacadeOptions.forEach((option) => {
    const item = document.createElement("label");
    item.className = "unit-inline-checkbox";
    item.innerHTML = `
      <input type="checkbox" value="${escapeHtml(option)}" ${selected.has(option) ? "checked" : ""}>
      <span>${escapeHtml(option)}</span>
    `;
    list.append(item);
  });
  list.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", () => {
      state.fields.facades = [...list.querySelectorAll("input[type='checkbox']:checked")]
        .map((checkbox) => checkbox.value)
        .join(", ");
      autosave();
      renderValidation();
      updateStatus();
    });
  });
  label.append(createSpan("Gayrimenkulün Cepheli Olduğu Yönler"), list);
  return label;
}

function createUnitHeatingControl() {
  if (!state.fields.unitHeatingMounted) state.fields.unitHeatingMounted = "Evet";
  const wrapper = document.createElement("div");
  wrapper.className = "field unit-heating-field";
  const inner = document.createElement("div");
  inner.className = "unit-heating-control";
  inner.append(
    createUnitSelectField("", "unitHeatingType", unitHeatingOptions),
    createUnitCheckboxField("Monte", "unitHeatingMounted", "Evet"),
  );
  wrapper.append(createSpan("Isınma Sistemi"), inner);
  return wrapper;
}

function createUnitCheckboxField(labelText, key, checkedValue = "Evet") {
  const label = document.createElement("label");
  label.className = "unit-inline-checkbox unit-single-checkbox";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.field = key;
  input.checked = (state.fields[key] || checkedValue) === checkedValue;
  markFieldSourceState(input, key);
  input.addEventListener("change", () => {
    clearFieldSourceOwnership(key);
    state.fields[key] = input.checked ? checkedValue : "Hayır";
    autosave();
    renderValidation();
    updateStatus();
  });
  label.append(input, createSpan(labelText));
  return label;
}

function isProjectDetailFieldKey(fieldKey) {
  return [
    "projectType",
    "projectDate",
    "projectNo",
    "titleProjectType",
    "titleProjectDate",
    "titleProjectNo",
    "municipalityProjectType",
    "municipalityProjectDate",
    "municipalityProjectNo",
  ].includes(fieldKey);
}

function createProjectDetailsGrid(section) {
  const wrapper = document.createElement("div");
  wrapper.className = "project-details-grid field-wide";
  const hasDifferentProjects = state.fields.projectDifference === "Evet";
  const fieldMap = new Map(section.fields.map((field) => [field.key, field]));
  const rows = hasDifferentProjects
    ? [
        ["titleProjectType", "titleProjectDate", "titleProjectNo"],
        ["municipalityProjectType", "municipalityProjectDate", "municipalityProjectNo"],
      ]
    : [["projectType", "projectDate", "projectNo"]];

  rows.flat().forEach((key) => {
    const field = fieldMap.get(key);
    if (field) wrapper.append(createProjectDetailField(section, field));
  });

  return wrapper;
}

function createProjectDetailField(section, field) {
  const label = document.createElement("label");
  label.className = "field";
  const value = state.fields[field.key] || "";
  const control = field.type === "select" ? document.createElement("select") : document.createElement("input");

  if (field.type === "select") {
    field.options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option || "Seçiniz";
      control.append(item);
    });
  } else {
    control.type = field.type;
  }

  control.value = value;
  control.dataset.field = field.key;
  markFieldSourceState(control, field.key);
  control.addEventListener("input", (event) => {
    clearFieldSourceOwnership(field.key);
    state.fields[field.key] = event.target.value;
    autosave();
    renderValidation();
    updateStatus();
  });
  control.addEventListener("blur", () => {
    const formattedValue = normalizeReportFieldValue(field.key, control.value);
    if (formattedValue === control.value) return;
    control.value = formattedValue;
    state.fields[field.key] = formattedValue;
    autosave();
    renderValidation();
    updateStatus();
  });

  label.append(createSpan(getFieldDisplayLabel(section.id, field)), control);
  return label;
}

function createProjectSuitabilityControl() {
  const wrapper = document.createElement("div");
  wrapper.className = "project-suitability-grid field-wide";
  const hasDifferentProjects = state.fields.projectDifference === "Evet";

  if (hasDifferentProjects) {
    wrapper.append(
      createProjectSuitabilityPanel(
        "Tapu Projesi - Uygunluk Durumu",
        "titleProjectSuitabilityStatus",
        "titleProjectSuitabilityNote",
        "titleProjectSuitabilitySimpleRepair",
      ),
      createProjectSuitabilityPanel(
        "Belediye Projesi - Uygunluk Durumu",
        "municipalityProjectSuitabilityStatus",
        "municipalityProjectSuitabilityNote",
        "municipalityProjectSuitabilitySimpleRepair",
      ),
    );
    wrapper.append(createMainRealEstateProjectSuitabilityControl());
  } else {
    wrapper.append(
      createProjectSuitabilityField(
        "Proje Uygunluk Durumu - Bağımsız Bölüm",
        "projectSuitabilityStatus",
        "projectConformity",
        "projectSuitabilitySimpleRepair",
      ),
      createMainRealEstateProjectSuitabilityControl(),
    );
  }

  return wrapper;
}

function createProjectSuitabilityPanel(title, statusKey, noteKey, repairKey) {
  const panel = document.createElement("div");
  panel.className = "project-suitability-panel";
  panel.append(createProjectSuitabilityField(title, statusKey, noteKey, repairKey));
  return panel;
}

function createProjectSuitabilityField(labelText, key, noteKey, repairKey) {
  const label = document.createElement("label");
  label.className = "field project-suitability-field";
  const control = document.createElement("div");
  control.className = "project-suitability-control";
  const select = document.createElement("select");
  select.dataset.field = key;
  projectSuitabilityOptions.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = state.fields[key] || "";
  markFieldSourceState(select, key);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "conditional-detail-button";
  detailButton.textContent = "Detay";
  detailButton.hidden = !shouldOpenProjectSuitabilityDetail(select.value);

  const openDetail = () => {
    openProjectSuitabilityDetailModal({
      statusKey: key,
      noteKey,
      repairKey,
      title: labelText,
      selectedStatus: state.fields[key] || select.value,
    }, () => {
      renderSection();
    });
  };

  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(key);
    state.fields[key] = event.target.value;
    detailButton.hidden = !shouldOpenProjectSuitabilityDetail(state.fields[key]);
    autosave();
    renderValidation();
    updateStatus();
    if (shouldOpenProjectSuitabilityDetail(state.fields[key])) {
      openDetail();
    }
  });
  detailButton.addEventListener("click", openDetail);
  control.append(select, detailButton);
  label.append(createSpan(labelText), control);
  return label;
}

function shouldOpenProjectSuitabilityDetail(value) {
  return Boolean(value) && value !== "uygundur.";
}

function openProjectSuitabilityDetailModal(config, onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card modal-card-wide" role="dialog" aria-modal="true" aria-labelledby="projectSuitabilityModalTitle">
      <div class="modal-head">
        <h3 id="projectSuitabilityModalTitle">${escapeHtml(config.title || "Proje Uygunluk Detayı")}</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <div class="project-suitability-modal-grid">
          <label class="field">
            <span>Açıklama</span>
            <textarea data-project-suitability-note rows="5"></textarea>
          </label>
          <label class="field">
            <span>Basit Bir Tadilat İle Düzeltilebilir mi?</span>
            <select data-project-suitability-repair>
              <option value="Evet">Evet</option>
              <option value="Hayır">Hayır</option>
            </select>
          </label>
        </div>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-project-suitability-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-project-suitability-save>Kaydet</button>
      </div>
    </div>
  `;

  const noteInput = overlay.querySelector("[data-project-suitability-note]");
  const repairSelect = overlay.querySelector("[data-project-suitability-repair]");
  noteInput.value = state.fields[config.noteKey] || "";
  repairSelect.value = normalizeYesNoChoice(state.fields[config.repairKey]) || "Evet";

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-project-suitability-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-project-suitability-save]").addEventListener("click", () => {
    state.fields[config.statusKey] = config.selectedStatus || state.fields[config.statusKey] || "";
    state.fields[config.noteKey] = normalizeReportDescriptionText(noteInput.value);
    state.fields[config.repairKey] = normalizeYesNoChoice(repairSelect.value) || "Evet";
    refreshMainPropertyDescriptionFromCurrentFields(config.statusKey);
    refreshMainPropertyDescriptionFromCurrentFields(config.noteKey);
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  noteInput.focus();
}

function createMainRealEstateProjectSuitabilityControl() {
  const key = "mainRealEstateProjectSuitable";
  const detailKey = "mainRealEstateProjectSuitabilityNote";
  if (!state.fields[key]) state.fields[key] = "Evet";

  const label = document.createElement("label");
  label.className = "field project-main-suitability-field";
  const title = createSpan("Ana Gayrimenkul Projesine Uygun Mu?");
  const control = document.createElement("div");
  control.className = "conditional-yes-no-control";

  const select = document.createElement("select");
  select.dataset.field = key;
  ["Evet", "Hayır"].forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option;
    select.append(item);
  });
  select.value = state.fields[key] || "Evet";
  markFieldSourceState(select, key);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "conditional-detail-button";
  detailButton.textContent = "Açıklama";
  detailButton.hidden = select.value !== "Hayır";

  const openNote = () => {
    openConditionalExplanationModal({
      key,
      label: "Ana Gayrimenkul Projesine Uygun Mu?",
      detailKey,
      detailTitle: "Ana Gayrimenkul Projesine Uygunluk Açıklaması",
      detailLabel: "Açıklama",
    }, () => {
      renderSection();
    });
  };

  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(key);
    state.fields[key] = event.target.value;
    detailButton.hidden = state.fields[key] !== "Hayır";
    refreshMainPropertyDescriptionFromCurrentFields(key);
    autosave();
    renderValidation();
    updateStatus();
    if (state.fields[key] === "Hayır") openNote();
  });

  detailButton.addEventListener("click", openNote);
  control.append(select, detailButton);
  label.append(title, control);
  return label;
}

function createProjectSuitabilityNoteField(labelText, key) {
  const label = document.createElement("label");
  label.className = "field project-suitability-note";
  const textarea = document.createElement("textarea");
  textarea.dataset.field = key;
  textarea.value = state.fields[key] || "";
  markFieldSourceState(textarea, key);
  textarea.addEventListener("input", (event) => {
    clearFieldSourceOwnership(key);
    state.fields[key] = event.target.value;
    autosave();
    renderValidation();
    updateStatus();
  });
  textarea.addEventListener("blur", () => {
    const formattedValue = normalizeReportFieldValue(key, textarea.value);
    if (formattedValue === textarea.value) return;
    textarea.value = formattedValue;
    state.fields[key] = formattedValue;
    autosave();
    renderValidation();
    updateStatus();
  });
  label.append(createSpan(labelText), textarea);
  return label;
}

function shouldHideField(sectionId, fieldKey) {
  if (sectionId === "case") {
    if (fieldKey === "currentUsageNature") {
      return state.fields.usageNatureDifference !== "Evet";
    }
  }
  if (sectionId === "title") {
    if (!["titleQuality", "titleBlockName", "titleFloor", "unitNo"].includes(fieldKey)) return false;
    return isMainPropertyGroundType(state.fields.groundType);
  }
  if (sectionId === "address") {
    const environmentType = detectEnvironmentalRegionType(state.fields.environmentRegionType);
    const commercialEnvironmentKeys = ["commercialFunctionDensity", "commercialFirmType", "commercialFrontageRoadType", "commercialDevelopmentCompleted"];
    if (commercialEnvironmentKeys.includes(fieldKey)) {
      return environmentType !== "Ticaret Bölgesi";
    }
    const agriculturalEnvironmentKeys = ["agriculturalActivityDensity", "agriculturalActivityTypes", "agriculturalSuitability"];
    if (agriculturalEnvironmentKeys.includes(fieldKey)) {
      return environmentType !== "Tarımsal Alan";
    }
    const hiddenForAgriculturalEnvironmentKeys = [
      "regionBuildOrder",
      "regionFloorRange",
      "regionIncomeLevel",
      "infrastructureLevel",
      "developmentSpeed",
      "regionBuildingAge",
      "socialNeeds",
      "regionUsePurpose",
      "planningPrincipleHarmony",
    ];
    if (environmentType === "Tarımsal Alan" && hiddenForAgriculturalEnvironmentKeys.includes(fieldKey)) {
      return true;
    }
    if (fieldKey === "regionIncomeLevel") {
      return environmentType === "Sanayi Bölgesi";
    }
  }
  if (sectionId === "documents") {
    if (fieldKey === "projectRegisteredInCadastre") {
      return shouldShowArchitecturalProjectFields();
    }
    if (isCadastralRegistrationDetailField(fieldKey)) {
      return shouldShowArchitecturalProjectFields() || state.fields.projectRegisteredInCadastre !== "Evet";
    }
    if (!shouldShowArchitecturalProjectFields() && isArchitecturalProjectDependentField(fieldKey)) {
      return true;
    }
    const hasDifferentProjects = state.fields.projectDifference === "Evet";
    if (["titleProjectDate", "titleProjectNo", "titleProjectType", "municipalityProjectDate", "municipalityProjectNo", "municipalityProjectType"].includes(fieldKey)) {
      return !hasDifferentProjects;
    }
    if (["projectDate", "projectNo", "projectType"].includes(fieldKey)) {
      return hasDifferentProjects;
    }
  }
  if (sectionId === "documents" && isEkbFieldKey(fieldKey)) {
    return !shouldShowEkbFields();
  }
  return false;
}

function shouldShowArchitecturalProjectFields() {
  return (state.fields.hasArchitecturalProject || "Evet") === "Evet";
}

function isArchitecturalProjectDependentField(fieldKey) {
  return [
    "projectInstitution",
    "documentReviewInstitution",
    "projectDifference",
    "projectDate",
    "projectNo",
    "projectType",
    "titleProjectDate",
    "titleProjectNo",
    "titleProjectType",
    "municipalityProjectDate",
    "municipalityProjectNo",
    "municipalityProjectType",
    "projectConformity",
    "reviewedDocumentsDescription",
    "hasEkb",
    "ekbDocumentNo",
    "ekbIssueDate",
    "ekbValidUntil",
    "ekbEnergyClass",
    "ekbEmissionClass",
  ].includes(fieldKey);
}

function isCadastralRegistrationDetailField(fieldKey) {
  return [
    "cadastralRegisteredBaseArea",
    "cadastralFootprintMatches",
    "cadastralCorrectionFloorCount",
  ].includes(fieldKey);
}

function isPlanningIssueDetailField(fieldKey) {
  return [
    "planCancellationStay",
    "planCancellationStayNote",
    "roadSetback",
    "minimumFrontageCondition",
    "minimumFrontageConditionNote",
    "tevhidCondition",
    "tevhidConditionNote",
    "article18Applied",
    "article18AppliedNote",
    "urbanTransformationArea",
    "urbanTransformationAreaNote",
    "licenseObstacle",
    "licenseObstacleNote",
    "planRestrictionNote",
  ].includes(fieldKey);
}

function shouldShowPlanningIssueFields(fields = state.fields) {
  return normalizeYesNoChoice(fields?.hasPlanningIssue) === "Evet";
}

function getFieldDisplayLabel(sectionId, field) {
  if (sectionId === "documents" && state.fields.projectDifference !== "Evet") {
    if (field.key === "projectDate") return "Tapu/Belediye Proje Tarihi";
    if (field.key === "projectNo") return "Tapu/Belediye Proje No";
    if (field.key === "projectType") return "Tapu/Belediye Proje Türü";
  }
  return field.label;
}

function isEkbFieldKey(fieldKey) {
  return ["ekbDocumentNo", "ekbIssueDate", "ekbValidUntil", "ekbEnergyClass", "ekbEmissionClass"].includes(fieldKey);
}

function shouldShowEkbFields() {
  return normalizeYesNoChoice(state.fields.hasEkb) === "Evet";
}

function isMainPropertyGroundType(value) {
  const folded = foldTurkish(value).replace(/[^A-Z]/g, "");
  return folded === "ANATASINMAZ";
}

function createSpan(text) {
  const span = document.createElement("span");
  span.textContent = formatUiHeading(text);
  return span;
}

function formatUiHeading(value) {
  const acronymMap = new Map([
    ["uavt", "UAVT"],
    ["takbis", "TAKBİS"],
    ["ekb", "EKB"],
    ["bb", "BB"],
    ["taks", "TAKS"],
    ["kaks", "KAKS"],
    ["hmax", "Hmax"],
    ["no", "No"],
    ["sos.", "Sos."],
    ["kul.", "Kul."],
  ]);
  return String(value || "")
    .split(/(\s+|\/)/)
    .map((part) => {
      if (/^\s+$|^\/$/.test(part) || !part) return part;
      const key = part.toLocaleLowerCase("tr");
      if (acronymMap.has(key)) return acronymMap.get(key);
      return part
        .split("-")
        .map((piece) => {
          if (!piece) return piece;
          const pieceKey = piece.toLocaleLowerCase("tr");
          if (acronymMap.has(pieceKey)) return acronymMap.get(pieceKey);
          return piece.charAt(0).toLocaleUpperCase("tr") + piece.slice(1);
        })
        .join("-");
    })
    .join("");
}

function createHint(text) {
  const hint = document.createElement("small");
  hint.className = "field-hint";
  hint.textContent = text;
  return hint;
}

function getConditionalYesNoPlanningFields() {
  return sections
    .flatMap((section) => section.fields || [])
    .filter((field) => field.type === "conditionalYesNo");
}

function getLookupValuesForField(key) {
  const values = new Set(state.lookupOptions?.[key] || []);
  const currentValue = state.fields[key];
  if (currentValue) values.add(currentValue);
  return [...values].filter(Boolean);
}

function createLookupDatalist(id, values) {
  const datalist = document.createElement("datalist");
  datalist.id = id;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    datalist.append(option);
  });
  return datalist;
}

function markFieldSourceState(control, key, isStaticAutoFill = false) {
  const isSourceApplied = isStaticAutoFill || isFieldValueAppliedFromSource(key);
  control.classList.toggle("source-applied-input", Boolean(isSourceApplied));
  control.classList.toggle("auto-filled-input", Boolean(isSourceApplied));
}

function isFieldValueAppliedFromSource(key) {
  const currentValue = normalizeReportFieldValue(key, state.fields[key] || "");
  if (!currentValue) return false;
  return Object.entries(state.sourceValues || {}).some(([sourceKey, source]) => {
    if (sourceKey === "businessDate") return false;
    const appliedValue = source?.applied?.[key];
    return appliedValue && normalizeReportFieldValue(key, appliedValue) === currentValue;
  });
}

function isFieldKeyOwnedBySource(key, targetState = state) {
  return Object.entries(targetState.sourceValues || {}).some(([sourceKey, source]) => {
    if (sourceKey === "businessDate") return false;
    return Boolean(source?.applied && Object.prototype.hasOwnProperty.call(source.applied, key));
  });
}

function getUserDefaultValueForField(field, targetState = state) {
  const value = targetState.settings?.userDefaults?.[field.key];
  return value === undefined || value === null ? "" : String(value);
}

function getEffectiveDefaultValueForField(field, targetState = state) {
  const userDefault = getUserDefaultValueForField(field, targetState);
  if (userDefault) return userDefault;
  return field.defaultValue || "";
}

function applyUserDefaultToField(field, targetState = state) {
  if (!field?.key || targetState.fields[field.key] || isFieldKeyOwnedBySource(field.key, targetState)) return false;
  const defaultValue = getEffectiveDefaultValueForField(field, targetState);
  if (!defaultValue) return false;
  targetState.fields[field.key] = defaultValue;
  return true;
}

function applyUserFieldDefaults(targetState = state) {
  if (!targetState.settings) targetState.settings = {};
  if (!targetState.settings.userDefaults) targetState.settings.userDefaults = loadUserDefaults();
  let changed = false;
  collectUserDefaultEligibleFields().forEach((field) => {
    if (applyUserDefaultToField(field, targetState)) changed = true;
  });
  return changed;
}

function clearFieldSourceOwnership(key) {
  Object.values(state.sourceValues || {}).forEach((source) => {
    if (source?.applied) delete source.applied[key];
  });
}

function mergeLookupOptions(values = {}) {
  state.lookupOptions = state.lookupOptions || {};
  Object.entries(values).forEach(([key, value]) => {
    const cleanValues = Array.isArray(value) ? value : [value];
    const next = new Set(state.lookupOptions[key] || []);
    cleanValues.map(cleanupPlaceName).filter(Boolean).forEach((item) => next.add(item));
    state.lookupOptions[key] = [...next].slice(0, 20);
  });
}

function createTransportNearbyComposer(transportField, nearbyField) {
  const wrapper = document.createElement("div");
  wrapper.className = "transport-nearby-composer";

  const arteryField = sections.find((section) => section.id === "address")?.fields.find((item) => item.key === "mainArtery") || {
    key: "mainArtery",
    label: "Ulaşım ana arteri",
  };
  const arteryTools = createMainArteryComposer(arteryField);
  const transportLabel = createTextareaField(transportField, transportField.label, "transport-text-field");
  const nearbyLabel = createTextareaField(nearbyField, "YAKIN ÇEVRESİNDE BULUNAN ÖNEMLİ ARTERLER", "nearby-text-field");

  const transportRow = document.createElement("div");
  transportRow.className = "transport-nearby-row";
  transportRow.append(arteryTools, transportLabel);

  const selection = createNearbyEnvironmentTools({ compact: true });
  const nearbyRow = document.createElement("div");
  nearbyRow.className = "transport-nearby-row";
  nearbyRow.append(selection, nearbyLabel);

  wrapper.append(transportRow, nearbyRow);
  return wrapper;
}

function createNearbyComposer(field) {
  const label = document.createElement("label");
  label.className = "field nearby-text-field";
  const labelText = field.key === "nearby" ? "YAKIN ÇEVRESİNDE BULUNAN ÖNEMLİ ARTERLER" : field.label;
  return createTextareaField(field, labelText, "nearby-text-field");
}

function formatPlaceWithDistance(place) {
  const distance = Number.isFinite(place?.distance) ? `${Math.round(place.distance)} m` : "";
  return distance ? `${place.name} - (${distance})` : place?.name || "";
}

function createTextareaField(field, labelText, extraClass = "") {
  const label = document.createElement("label");
  label.className = `field ${extraClass}`.trim();
  const textarea = document.createElement("textarea");
  textarea.dataset.field = field.key;
  textarea.value = state.fields[field.key] || "";
  markFieldSourceState(textarea, field.key);
  textarea.addEventListener("input", (event) => {
    clearFieldSourceOwnership(field.key);
    state.fields[field.key] = event.target.value;
    autosave();
    renderValidation();
    updateStatus();
  });
  textarea.addEventListener("blur", () => {
    const formattedValue = normalizeReportFieldValue(field.key, textarea.value);
    if (formattedValue === textarea.value) return;
    textarea.value = formattedValue;
    state.fields[field.key] = formattedValue;
    autosave();
    renderValidation();
    updateStatus();
  });
  label.append(createSpan(labelText), textarea);
  return label;
}

function createRoadSetbackControl(field) {
  const label = document.createElement("label");
  label.className = "field";

  const control = document.createElement("div");
  control.className = "road-setback-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  (field.options || ["", "Evet", "Hayır"]).forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = normalizeYesNoChoice(state.fields.roadSetback);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "road-setback-detail-button";
  detailButton.textContent = "Detay";
  detailButton.disabled = select.value !== "Evet";

  const summary = document.createElement("small");
  summary.className = "road-setback-summary";
  summary.textContent = formatRoadSetbackSummary();

  select.addEventListener("input", (event) => {
    const nextValue = normalizeYesNoChoice(event.target.value);
    state.fields.roadSetback = nextValue;
    select.value = nextValue;
    detailButton.disabled = nextValue !== "Evet";

    if (nextValue !== "Evet") {
      state.fields.roadSetbackAmount = "";
      state.fields.roadSetbackBuildingImpact = "";
    }

    summary.textContent = formatRoadSetbackSummary();
    refreshPlanningNoteFromCurrentFields(field.key);
    autosave();
    renderValidation();
    updateStatus();

    if (nextValue === "Evet") {
      openRoadSetbackModal(() => {
        summary.textContent = formatRoadSetbackSummary();
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openRoadSetbackModal(() => {
      summary.textContent = formatRoadSetbackSummary();
    });
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function createLandRoadFrontageControl(field) {
  const label = document.createElement("label");
  label.className = "field";

  const control = document.createElement("div");
  control.className = "road-setback-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  (field.options || ["", "Evet", "Hayır"]).forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = normalizeYesNoChoice(state.fields.landRoadFrontage);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "road-setback-detail-button";
  detailButton.textContent = "Detay";
  detailButton.disabled = select.value !== "Evet";

  const summary = document.createElement("small");
  summary.className = "road-setback-summary";
  summary.textContent = formatLandRoadFrontageSummary();

  select.addEventListener("input", (event) => {
    const nextValue = normalizeYesNoChoice(event.target.value);
    state.fields.landRoadFrontage = nextValue;
    select.value = nextValue;
    detailButton.disabled = nextValue !== "Evet";

    if (nextValue !== "Evet") {
      state.fields.landRoadType = "";
      state.fields.landRoadName = "";
      state.fields.landRoadDirection = "";
      state.fields.landRoadFrontageLength = "";
    }

    summary.textContent = formatLandRoadFrontageSummary();
    autosave();
    renderValidation();
    updateStatus();

    if (nextValue === "Evet") {
      openLandRoadFrontageModal(() => {
        summary.textContent = formatLandRoadFrontageSummary();
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openLandRoadFrontageModal(() => {
      summary.textContent = formatLandRoadFrontageSummary();
    });
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function formatLandRoadFrontageSummary() {
  const value = normalizeYesNoChoice(state.fields.landRoadFrontage);
  if (!value) return "Seçiniz.";
  if (value !== "Evet") return "Yol cephesi yok.";
  const items = getLandRoadFrontageItems();
  if (items.length) {
    return items.map(formatLandRoadFrontageItem).join(" | ");
  }
  const parts = [];
  if (state.fields.landRoadType) parts.push(`Yol tipi: ${state.fields.landRoadType}`);
  if (state.fields.landRoadName) parts.push(`Cadde/sokak: ${state.fields.landRoadName}`);
  if (state.fields.landRoadDirection) parts.push(`Yön: ${state.fields.landRoadDirection}`);
  if (state.fields.landRoadFrontageLength) parts.push(`Cephe uzunluğu: ${state.fields.landRoadFrontageLength}`);
  return parts.length ? parts.join(" - ") : "Yol cephesi detayları bekliyor.";
}

function getLandRoadFrontageItems() {
  if (Array.isArray(state.fields.landRoadFrontageItems)) return state.fields.landRoadFrontageItems;
  if (state.fields.landRoadType || state.fields.landRoadDirection || state.fields.landRoadFrontageLength || state.fields.landRoadName) {
    return [{
      roadType: state.fields.landRoadType || "",
      roadName: state.fields.landRoadName || "",
      direction: state.fields.landRoadDirection || "",
      length: state.fields.landRoadFrontageLength || "",
    }];
  }
  return [];
}

function formatLandRoadFrontageItem(item = {}) {
  const parts = [];
  if (item.roadType) parts.push(item.roadType);
  if (item.roadName) parts.push(item.roadName);
  if (item.direction) parts.push(`${item.direction} cephesi`);
  if (item.length) parts.push(item.length);
  return parts.join(" - ");
}

function openLandRoadFrontageModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();
  const frontageOptions = getKmlFrontageOptionsFromCoordinates(state.sourceValues.kml?.coordinates || []);
  let frontageItems = getLandRoadFrontageItems().map((item) => ({ ...item }));

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="landRoadFrontageModalTitle">
      <div class="modal-head">
        <h3 id="landRoadFrontageModalTitle">Kadastro/İmar Yolu Cephe Detayı</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>Yol Tipi</span>
          <select data-land-road-type>
            <option value="">Seçiniz</option>
            <option value="Kadastro yolu">Kadastro yolu</option>
            <option value="İmar yolu">İmar yolu</option>
            <option value="Kadastro ve imar yolu">Kadastro ve imar yolu</option>
          </select>
        </label>
        <label class="field" data-land-road-name-field hidden>
          <span>Cadde / Sokak Adı</span>
          <input type="text" data-land-road-name>
        </label>
        <div class="field">
          <span>Yön / Cephe Uzunluğu</span>
          <div class="frontage-choice-row">
            <select data-land-road-frontage-choice>
              <option value="">KML cephesi seçiniz</option>
              ${frontageOptions.map((edge) => `
                <option value="${escapeHtml(edge.direction)}|${escapeHtml(formatMeterLength(edge.length))}">
                  ${escapeHtml(edge.direction)} cephesi - ${escapeHtml(formatMeterLength(edge.length))}
                </option>
              `).join("")}
            </select>
            <select data-land-road-direction>
              <option value="">Yön seçiniz</option>
              <option value="Kuzey">Kuzey</option>
              <option value="Güney">Güney</option>
              <option value="Doğu">Doğu</option>
              <option value="Batı">Batı</option>
              <option value="Kuzeydoğu">Kuzeydoğu</option>
              <option value="Kuzeybatı">Kuzeybatı</option>
              <option value="Güneydoğu">Güneydoğu</option>
              <option value="Güneybatı">Güneybatı</option>
            </select>
            <input type="text" data-land-road-frontage-length placeholder="Cephe uzunluğu">
          </div>
        </div>
        <button class="secondary-button land-frontage-add-button" type="button" data-land-road-frontage-add>Ekle</button>
        <div class="land-frontage-item-list" data-land-road-frontage-list></div>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-land-road-frontage-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-land-road-frontage-save>Kaydet</button>
      </div>
    </div>
  `;

  const roadTypeSelect = overlay.querySelector("[data-land-road-type]");
  const roadNameField = overlay.querySelector("[data-land-road-name-field]");
  const roadNameInput = overlay.querySelector("[data-land-road-name]");
  const directionSelect = overlay.querySelector("[data-land-road-direction]");
  const frontageChoiceSelect = overlay.querySelector("[data-land-road-frontage-choice]");
  const frontageLengthInput = overlay.querySelector("[data-land-road-frontage-length]");
  const addButton = overlay.querySelector("[data-land-road-frontage-add]");
  const frontageList = overlay.querySelector("[data-land-road-frontage-list]");
  roadTypeSelect.value = state.fields.landRoadType || "";
  roadNameInput.value = state.fields.landRoadName || "";
  directionSelect.value = state.fields.landRoadDirection || "";
  frontageLengthInput.value = state.fields.landRoadFrontageLength || "";

  const syncRoadNameVisibility = () => {
    const needsRoadName = String(roadTypeSelect.value || "").toLocaleLowerCase("tr").includes("imar yolu");
    roadNameField.hidden = !needsRoadName;
    if (!needsRoadName) roadNameInput.value = "";
  };
  const syncFrontageChoice = () => {
    const matchingOption = frontageOptions.find((edge) =>
      edge.direction === directionSelect.value && formatMeterLength(edge.length) === frontageLengthInput.value
    );
    frontageChoiceSelect.value = matchingOption ? `${matchingOption.direction}|${formatMeterLength(matchingOption.length)}` : "";
  };
  syncRoadNameVisibility();
  syncFrontageChoice();
  const resetEntryFields = () => {
    roadTypeSelect.value = "";
    roadNameInput.value = "";
    directionSelect.value = "";
    frontageChoiceSelect.value = "";
    frontageLengthInput.value = "";
    syncRoadNameVisibility();
  };
  const renderFrontageItems = () => {
    frontageList.innerHTML = frontageItems.length
      ? frontageItems.map((item, index) => `
          <div class="land-frontage-item-row">
            <span>${escapeHtml(formatLandRoadFrontageItem(item) || "Eksik cephe kaydı")}</span>
            <button class="row-delete-button" type="button" data-remove-land-frontage="${index}" aria-label="Satırı sil">×</button>
          </div>
        `).join("")
      : `<p class="empty-frontage-list">Henüz cephe eklenmedi.</p>`;
  };
  renderFrontageItems();
  roadTypeSelect.addEventListener("input", syncRoadNameVisibility);
  frontageChoiceSelect.addEventListener("input", () => {
    const [direction, length] = frontageChoiceSelect.value.split("|");
    directionSelect.value = direction || "";
    frontageLengthInput.value = length || "";
  });
  directionSelect.addEventListener("input", syncFrontageChoice);
  frontageLengthInput.addEventListener("input", syncFrontageChoice);
  addButton.addEventListener("click", () => {
    const item = {
      roadType: roadTypeSelect.value,
      roadName: normalizeReportTitleText(roadNameInput.value),
      direction: directionSelect.value,
      length: normalizeReportTitleText(frontageLengthInput.value),
    };
    if (!item.roadType && !item.roadName && !item.direction && !item.length) return;
    frontageItems.push(item);
    renderFrontageItems();
    resetEntryFields();
  });
  frontageList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-land-frontage]");
    if (!button) return;
    const index = Number(button.dataset.removeLandFrontage);
    frontageItems = frontageItems.filter((_, itemIndex) => itemIndex !== index);
    renderFrontageItems();
  });

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-land-road-frontage-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-land-road-frontage-save]").addEventListener("click", () => {
    if (!frontageItems.length) {
      const pendingItem = {
        roadType: roadTypeSelect.value,
        roadName: normalizeReportTitleText(roadNameInput.value),
        direction: directionSelect.value,
        length: normalizeReportTitleText(frontageLengthInput.value),
      };
      if (pendingItem.roadType || pendingItem.roadName || pendingItem.direction || pendingItem.length) {
        frontageItems.push(pendingItem);
      }
    }
    state.fields.landRoadFrontage = "Evet";
    state.fields.landRoadFrontageItems = frontageItems;
    const firstItem = frontageItems[0] || {};
    state.fields.landRoadType = firstItem.roadType || "";
    state.fields.landRoadName = firstItem.roadName || "";
    state.fields.landRoadDirection = firstItem.direction || "";
    state.fields.landRoadFrontageLength = firstItem.length || "";
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  roadTypeSelect.focus();
}

const irrigationWaterSourceOptions = [
  "",
  "Sulama Kanalı",
  "Kuyu Suyu",
  "Sulama Havuzu",
  "Dere",
  "Çay",
  "Nehir",
  "Baraj",
  "Sulama Göleti",
];

const irrigationSystemOptions = [
  "",
  "Salma Sulama",
  "Karık Sulama",
  "Tava Sulama",
  "Damla Sulama",
  "Yağmurlama Sulama",
  "Mikro Yağmurlama",
  "Pivot Sulama",
  "Lineer Hareketli Sulama",
  "Yer Altı Damla Sulama",
];

function createLandAgricultureTypeControl(field) {
  const label = document.createElement("label");
  label.className = "field";

  const control = document.createElement("div");
  control.className = "road-setback-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  field.options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.textContent = option || "Seçiniz";
    select.append(optionElement);
  });
  select.value = state.fields.landAgricultureType || "";
  markFieldSourceState(select, field.key);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "road-setback-detail-button";
  detailButton.textContent = "Detay";
  detailButton.disabled = select.value !== "Sulu Tarım";

  const summary = document.createElement("small");
  summary.className = "road-setback-summary";
  summary.textContent = formatLandAgricultureTypeSummary();

  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(field.key);
    const nextValue = event.target.value;
    state.fields.landAgricultureType = nextValue;
    select.value = nextValue;
    detailButton.disabled = nextValue !== "Sulu Tarım";

    if (nextValue !== "Sulu Tarım") {
      clearLandIrrigationDetails();
    }

    summary.textContent = formatLandAgricultureTypeSummary();
    autosave();
    renderValidation();
    updateStatus();

    if (nextValue === "Sulu Tarım") {
      openLandIrrigationModal(() => {
        summary.textContent = formatLandAgricultureTypeSummary();
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openLandIrrigationModal(() => {
      summary.textContent = formatLandAgricultureTypeSummary();
    });
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function clearLandIrrigationDetails() {
  state.fields.landIrrigationWaterSource = "";
  state.fields.landIrrigationSystem = "";
}

function formatLandAgricultureTypeSummary() {
  const type = state.fields.landAgricultureType || "";
  if (!type) return "Seçiniz.";
  if (type !== "Sulu Tarım") return "Kuru tarım; sulama detayı alınmaz.";
  const parts = [];
  if (state.fields.landIrrigationWaterSource) parts.push(`Su kaynağı: ${state.fields.landIrrigationWaterSource}`);
  if (state.fields.landIrrigationSystem) parts.push(`Sulama sistemi: ${state.fields.landIrrigationSystem}`);
  return parts.length ? parts.join(" - ") : "Sulu tarım detayları bekliyor.";
}

function openLandIrrigationModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="landIrrigationModalTitle">
      <div class="modal-head">
        <h3 id="landIrrigationModalTitle">Sulu Tarım Detayı</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>Su Kaynağı</span>
          <select data-land-irrigation-water-source>
            ${irrigationWaterSourceOptions.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option || "Seçiniz")}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>Sulama Sistemi</span>
          <select data-land-irrigation-system>
            ${irrigationSystemOptions.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option || "Seçiniz")}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-land-irrigation-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-land-irrigation-save>Kaydet</button>
      </div>
    </div>
  `;

  const waterSourceSelect = overlay.querySelector("[data-land-irrigation-water-source]");
  const irrigationSystemSelect = overlay.querySelector("[data-land-irrigation-system]");
  waterSourceSelect.value = state.fields.landIrrigationWaterSource || "";
  irrigationSystemSelect.value = state.fields.landIrrigationSystem || "";

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-land-irrigation-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-land-irrigation-save]").addEventListener("click", () => {
    state.fields.landAgricultureType = "Sulu Tarım";
    state.fields.landIrrigationWaterSource = waterSourceSelect.value;
    state.fields.landIrrigationSystem = irrigationSystemSelect.value;
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  waterSourceSelect.focus();
}

const landBoundaryElementOptions = [
  "Duvar",
  "Taş Duvar",
  "İstinat Duvarı",
  "Tel Örgü",
  "Çit",
  "Beton Direk",
  "Demir Direk",
  "Kazık / Sınır İşareti",
  "Hendek",
  "Şev / Kot Farkı",
  "Dere / Doğal Su Yatağı",
  "Yol",
  "Ağaçlık / Bitkisel Sınır",
  "Komşu Parsel Sınırı",
];

function createLandBoundaryElementControl(field) {
  const label = document.createElement("label");
  label.className = "field";

  const control = document.createElement("div");
  control.className = "road-setback-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  field.options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.textContent = option || "Seçiniz";
    select.append(optionElement);
  });
  select.value = normalizeYesNoChoice(state.fields.landBoundaryElement);
  markFieldSourceState(select, field.key);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "road-setback-detail-button";
  detailButton.textContent = "Detay";
  detailButton.disabled = select.value !== "Evet";

  const summary = document.createElement("small");
  summary.className = "road-setback-summary";
  summary.textContent = formatLandBoundaryElementSummary();

  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(field.key);
    const nextValue = normalizeYesNoChoice(event.target.value);
    state.fields.landBoundaryElement = nextValue;
    select.value = nextValue;
    detailButton.disabled = nextValue !== "Evet";

    if (nextValue !== "Evet") {
      clearLandBoundaryElementDetails();
    }

    summary.textContent = formatLandBoundaryElementSummary();
    autosave();
    renderValidation();
    updateStatus();

    if (nextValue === "Evet") {
      openLandBoundaryElementModal(() => {
        summary.textContent = formatLandBoundaryElementSummary();
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openLandBoundaryElementModal(() => {
      summary.textContent = formatLandBoundaryElementSummary();
    });
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function clearLandBoundaryElementDetails() {
  state.fields.landBoundaryElementItems = [];
  state.fields.landBoundaryElementOther = "";
}

function getLandBoundaryElementItems() {
  return Array.isArray(state.fields.landBoundaryElementItems) ? state.fields.landBoundaryElementItems : [];
}

function formatLandBoundaryElementSummary() {
  const value = normalizeYesNoChoice(state.fields.landBoundaryElement);
  if (!value) return "Seçiniz.";
  if (value !== "Evet") return "Sınırları belirleyici unsur yok.";
  const parts = [...getLandBoundaryElementItems()];
  if (state.fields.landBoundaryElementOther) parts.push(state.fields.landBoundaryElementOther);
  return parts.length ? parts.join(", ") : "Sınır unsuru detayları bekliyor.";
}

function openLandBoundaryElementModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();
  const selectedItems = new Set(getLandBoundaryElementItems());

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="landBoundaryElementModalTitle">
      <div class="modal-head">
        <h3 id="landBoundaryElementModalTitle">Sınırları Belirleyici Unsur Detayı</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-lead">Parsel sınırını belirleyen unsurları seçiniz.</p>
        <div class="checkbox-list boundary-checkbox-list">
          ${landBoundaryElementOptions.map((option) => `
            <label class="checkbox-pill">
              <input type="checkbox" value="${escapeHtml(option)}" data-land-boundary-option>
              <span>${escapeHtml(option)}</span>
            </label>
          `).join("")}
        </div>
        <label class="field">
          <span>Diğer / Açıklama</span>
          <textarea data-land-boundary-other></textarea>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-land-boundary-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-land-boundary-save>Kaydet</button>
      </div>
    </div>
  `;

  const checkboxes = [...overlay.querySelectorAll("[data-land-boundary-option]")];
  const otherInput = overlay.querySelector("[data-land-boundary-other]");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectedItems.has(checkbox.value);
  });
  otherInput.value = state.fields.landBoundaryElementOther || "";

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-land-boundary-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-land-boundary-save]").addEventListener("click", () => {
    state.fields.landBoundaryElement = "Evet";
    state.fields.landBoundaryElementItems = checkboxes
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    state.fields.landBoundaryElementOther = normalizeReportDescriptionText(otherInput.value);
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  checkboxes[0]?.focus();
}

function createLandAgriculturalProductControl(field) {
  const label = document.createElement("label");
  label.className = "field";

  const control = document.createElement("div");
  control.className = "road-setback-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  field.options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.textContent = option || "Seçiniz";
    select.append(optionElement);
  });
  select.value = normalizeYesNoChoice(state.fields.landAgriculturalProduct);
  markFieldSourceState(select, field.key);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "road-setback-detail-button";
  detailButton.textContent = "Detay";
  detailButton.disabled = select.value !== "Evet";

  const summary = document.createElement("small");
  summary.className = "road-setback-summary";
  summary.textContent = formatLandAgriculturalProductSummary();

  select.addEventListener("input", (event) => {
    clearFieldSourceOwnership(field.key);
    const nextValue = normalizeYesNoChoice(event.target.value);
    state.fields.landAgriculturalProduct = nextValue;
    select.value = nextValue;
    detailButton.disabled = nextValue !== "Evet";

    if (nextValue !== "Evet") {
      clearLandAgriculturalProductDetails();
    }

    summary.textContent = formatLandAgriculturalProductSummary();
    autosave();
    renderValidation();
    updateStatus();

    if (nextValue === "Evet") {
      openLandAgriculturalProductModal(() => {
        summary.textContent = formatLandAgriculturalProductSummary();
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openLandAgriculturalProductModal(() => {
      summary.textContent = formatLandAgriculturalProductSummary();
    });
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function clearLandAgriculturalProductDetails() {
  state.fields.landAgriculturalProductType = "";
  state.fields.landAgriculturalUnitCount = "";
  state.fields.landAgriculturalAge = "";
  state.fields.landAgriculturalYield = "";
  state.fields.landAgriculturalTotalCount = "";
  state.fields.landAgriculturalProductItems = [];
}

function formatLandAgriculturalProductSummary() {
  const value = normalizeYesNoChoice(state.fields.landAgriculturalProduct);
  if (!value) return "Seçiniz.";
  if (value !== "Evet") return "Parsel üzerinde zirai ürün yok.";
  const items = getLandAgriculturalProductItems();
  if (items.length) {
    return items.map(formatLandAgriculturalProductItem).join(" | ");
  }
  const totalCount = calculateAgriculturalTotalCount(state.fields.landAgriculturalUnitCount);
  const parts = [];
  if (state.fields.landAgriculturalProductType) parts.push(`Tür: ${state.fields.landAgriculturalProductType}`);
  if (state.fields.landAgriculturalUnitCount) parts.push(`Dönüm/adet: ${state.fields.landAgriculturalUnitCount}`);
  if (state.fields.landAgriculturalAge) parts.push(`Yaş: ${state.fields.landAgriculturalAge}`);
  if (state.fields.landAgriculturalYield) parts.push(`Verim oranı: ${state.fields.landAgriculturalYield}`);
  if (totalCount) parts.push(`Tahmini toplam adet: ${totalCount}`);
  return parts.length ? parts.join(" - ") : "Zirai ürün detayları bekliyor.";
}

function getLandAgriculturalProductItems() {
  if (Array.isArray(state.fields.landAgriculturalProductItems)) return state.fields.landAgriculturalProductItems;
  if (
    state.fields.landAgriculturalProductType ||
    state.fields.landAgriculturalUnitCount ||
    state.fields.landAgriculturalAge ||
    state.fields.landAgriculturalYield ||
    state.fields.landAgriculturalTotalCount
  ) {
    return [{
      productType: state.fields.landAgriculturalProductType || "",
      unitCount: state.fields.landAgriculturalUnitCount || "",
      age: state.fields.landAgriculturalAge || "",
      yieldRate: state.fields.landAgriculturalYield || "",
      totalCount: state.fields.landAgriculturalTotalCount || calculateAgriculturalTotalCount(state.fields.landAgriculturalUnitCount),
    }];
  }
  return [];
}

function formatLandAgriculturalProductItem(item = {}) {
  const totalCount = item.totalCount || calculateAgriculturalTotalCount(item.unitCount);
  const parts = [];
  if (item.productType) parts.push(item.productType);
  if (item.unitCount) parts.push(`${item.unitCount} adet/dönüm`);
  if (item.age) parts.push(`${item.age} yaş`);
  if (item.yieldRate) parts.push(item.yieldRate);
  if (totalCount) parts.push(`tahmini ${totalCount} adet`);
  return parts.join(" - ");
}

function calculateAgriculturalTotalCount(unitCountValue = state.fields.landAgriculturalUnitCount) {
  const area = parseReportNumber(state.fields.landArea);
  const unitCount = parseReportNumber(unitCountValue);
  if (!Number.isFinite(area) || !Number.isFinite(unitCount)) return "";
  const total = (area / 1000) * unitCount;
  if (!Number.isFinite(total)) return "";
  return roundAgriculturalTreeCount(total).toLocaleString("tr-TR");
}

function roundAgriculturalTreeCount(value) {
  return Math.round(value / 10) * 10;
}

function parseReportNumber(value) {
  const text = String(value || "")
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "");
  if (!text) return Number.NaN;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/,/g, "");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
}

function formatSquareMeterArea(value) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m²`;
}

function openLandAgriculturalProductModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();
  let agriculturalItems = getLandAgriculturalProductItems().map((item) => ({ ...item }));

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="landAgriculturalProductModalTitle">
      <div class="modal-head">
        <h3 id="landAgriculturalProductModalTitle">Zirai Ürün Detayı</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>Zirai Ürün Türü</span>
          <input type="text" data-agricultural-product-type>
        </label>
        <label class="field">
          <span>Dönüm Adet Miktarı</span>
          <input type="text" data-agricultural-unit-count>
        </label>
        <label class="field">
          <span>Zirai Ürün Yaşı</span>
          <input type="text" data-agricultural-age placeholder="Örn. 1-2">
        </label>
        <label class="field">
          <span>Verim Oranı</span>
          <select data-agricultural-yield>
            <option value="">Seçiniz</option>
            <option value="Az (Bakımsız)">Az (Bakımsız)</option>
            <option value="Orta">Orta</option>
            <option value="Yüksek (Bakımlı)">Yüksek (Bakımlı)</option>
          </select>
        </label>
        <div class="agricultural-total-preview" data-agricultural-total-preview></div>
        <button class="secondary-button land-frontage-add-button" type="button" data-agricultural-add>Ekle</button>
        <div class="land-frontage-item-list" data-agricultural-product-list></div>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-agricultural-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-agricultural-save>Kaydet</button>
      </div>
    </div>
  `;

  const typeInput = overlay.querySelector("[data-agricultural-product-type]");
  const unitCountInput = overlay.querySelector("[data-agricultural-unit-count]");
  const ageInput = overlay.querySelector("[data-agricultural-age]");
  const yieldInput = overlay.querySelector("[data-agricultural-yield]");
  const preview = overlay.querySelector("[data-agricultural-total-preview]");
  const addButton = overlay.querySelector("[data-agricultural-add]");
  const productList = overlay.querySelector("[data-agricultural-product-list]");

  typeInput.value = state.fields.landAgriculturalProductType || "";
  unitCountInput.value = state.fields.landAgriculturalUnitCount || "";
  ageInput.value = state.fields.landAgriculturalAge || "";
  yieldInput.value = state.fields.landAgriculturalYield || "";

  const updatePreview = () => {
    const area = parseReportNumber(state.fields.landArea);
    const unitCount = parseReportNumber(unitCountInput.value);
    if (!Number.isFinite(area)) {
      preview.textContent = "Ana taşınmaz yüzölçümü boş olduğu için toplam adet hesaplanamadı.";
      return;
    }
    if (!Number.isFinite(unitCount)) {
      preview.textContent = `Yüzölçümü: ${formatSquareMeterArea(area)}. Dönüm adet miktarı girildiğinde toplam adet hesaplanır.`;
      return;
    }
    const total = roundAgriculturalTreeCount((area / 1000) * unitCount).toLocaleString("tr-TR");
    preview.textContent = `Yüzölçümü ${formatSquareMeterArea(area)} / 1.000 x ${unitCountInput.value} = tahmini ${total} adet.`;
  };
  const resetEntryFields = () => {
    typeInput.value = "";
    unitCountInput.value = "";
    ageInput.value = "";
    yieldInput.value = "";
    updatePreview();
  };
  const renderAgriculturalItems = () => {
    productList.innerHTML = agriculturalItems.length
      ? agriculturalItems.map((item, index) => `
          <div class="land-frontage-item-row">
            <span>${escapeHtml(formatLandAgriculturalProductItem(item) || "Eksik zirai ürün kaydı")}</span>
            <button class="row-delete-button" type="button" data-remove-agricultural-product="${index}" aria-label="Satırı sil">×</button>
          </div>
        `).join("")
      : `<p class="empty-frontage-list">Henüz zirai ürün eklenmedi.</p>`;
  };
  const collectAgriculturalItem = () => {
    const item = {
      productType: normalizeReportTitleText(typeInput.value),
      unitCount: normalizeReportTitleText(unitCountInput.value),
      age: normalizeReportTitleText(ageInput.value),
      yieldRate: yieldInput.value,
      totalCount: calculateAgriculturalTotalCount(unitCountInput.value),
    };
    return item;
  };
  updatePreview();
  renderAgriculturalItems();
  unitCountInput.addEventListener("input", updatePreview);
  addButton.addEventListener("click", () => {
    const item = collectAgriculturalItem();
    if (!item.productType && !item.unitCount && !item.age && !item.yieldRate && !item.totalCount) return;
    agriculturalItems.push(item);
    renderAgriculturalItems();
    resetEntryFields();
  });
  productList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-agricultural-product]");
    if (!button) return;
    const index = Number(button.dataset.removeAgriculturalProduct);
    agriculturalItems = agriculturalItems.filter((_, itemIndex) => itemIndex !== index);
    renderAgriculturalItems();
  });

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-agricultural-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-agricultural-save]").addEventListener("click", () => {
    if (!agriculturalItems.length) {
      const pendingItem = collectAgriculturalItem();
      if (pendingItem.productType || pendingItem.unitCount || pendingItem.age || pendingItem.yieldRate || pendingItem.totalCount) {
        agriculturalItems.push(pendingItem);
      }
    }
    state.fields.landAgriculturalProduct = "Evet";
    state.fields.landAgriculturalProductItems = agriculturalItems;
    const firstItem = agriculturalItems[0] || {};
    state.fields.landAgriculturalProductType = firstItem.productType || "";
    state.fields.landAgriculturalUnitCount = firstItem.unitCount || "";
    state.fields.landAgriculturalAge = firstItem.age || "";
    state.fields.landAgriculturalYield = firstItem.yieldRate || "";
    state.fields.landAgriculturalTotalCount = firstItem.totalCount || "";
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  typeInput.focus();
}

const externalAppraisalReasons = [
  "Müşteri talebi ile",
  "Kiracının şehir dışında olması",
  "Kiracının izin vermemesi",
  "Takip çalışması olması",
  "İşgalci bulunması",
  "Diğer",
];

function createAppointmentTypeControl(field) {
  const label = document.createElement("label");
  label.className = "field";
  label.classList.toggle("is-critical", Boolean(field.critical));

  const control = document.createElement("div");
  control.className = "conditional-yes-no-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  field.options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = state.fields[field.key] || "";

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "conditional-detail-button";
  detailButton.textContent = getAppointmentTypeDetailButtonLabel(select.value);
  detailButton.disabled = !shouldShowAppointmentTypeDetail(select.value);
  detailButton.hidden = !shouldShowAppointmentTypeDetail(select.value);

  const summary = document.createElement("small");
  summary.className = "conditional-summary";
  summary.textContent = formatAppointmentTypeSummary(select.value);
  summary.hidden = !shouldShowAppointmentTypeDetail(select.value);

  select.addEventListener("input", (event) => {
    const nextValue = event.target.value;
    state.fields[field.key] = nextValue;

    const shouldShowDetail = shouldShowAppointmentTypeDetail(nextValue);
    detailButton.textContent = getAppointmentTypeDetailButtonLabel(nextValue);
    detailButton.disabled = !shouldShowDetail;
    detailButton.hidden = !shouldShowDetail;

    if (nextValue !== "Dışarıdan ekspertiz") {
      state.fields.externalAppraisalReason = "";
      state.fields.externalAppraisalOtherNote = "";
    }
    if (nextValue !== "Kısıtlı inceleme") {
      state.fields.restrictedInspectionNote = "";
    }

    summary.textContent = formatAppointmentTypeSummary(nextValue);
    summary.hidden = !shouldShowDetail;
    autosave();
    renderValidation();
    updateStatus();
    if (activeSectionId === "unit") {
      renderSection();
    }

    if (nextValue === "Dışarıdan ekspertiz") {
      openExternalAppraisalReasonModal(() => {
        summary.textContent = formatAppointmentTypeSummary(nextValue);
      });
      return;
    }

    if (nextValue === "Kısıtlı inceleme") {
      openRestrictedInspectionModal(() => {
        summary.textContent = formatAppointmentTypeSummary(nextValue);
      });
    }
  });

  detailButton.addEventListener("click", () => {
    if (state.fields.appointmentType === "Dışarıdan ekspertiz") {
      openExternalAppraisalReasonModal(() => {
        summary.textContent = formatAppointmentTypeSummary(state.fields.appointmentType);
      });
      return;
    }

    if (state.fields.appointmentType === "Kısıtlı inceleme") {
      openRestrictedInspectionModal(() => {
        summary.textContent = formatAppointmentTypeSummary(state.fields.appointmentType);
      });
    }
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function shouldShowAppointmentTypeDetail(appointmentType) {
  return appointmentType === "Dışarıdan ekspertiz" || appointmentType === "Kısıtlı inceleme";
}

function getAppointmentTypeDetailButtonLabel(appointmentType) {
  if (appointmentType === "Dışarıdan ekspertiz") return "Sebep";
  if (appointmentType === "Kısıtlı inceleme") return "Açıklama";
  return "Detay";
}

function formatAppointmentTypeSummary(appointmentType) {
  if (appointmentType === "Dışarıdan ekspertiz") {
    return formatExternalAppraisalSummary();
  }
  if (appointmentType === "Kısıtlı inceleme") {
    return state.fields.restrictedInspectionNote || "Kısıtlı inceleme açıklaması bekliyor.";
  }
  return "";
}

function formatExternalAppraisalSummary() {
  if (state.fields.appointmentType !== "Dışarıdan ekspertiz") return "";
  const reason = state.fields.externalAppraisalReason || "";
  if (!reason) return "Dışarıdan ekspertiz sebebi bekliyor.";
  if (reason === "Diğer" && state.fields.externalAppraisalOtherNote) {
    return `Diğer: ${state.fields.externalAppraisalOtherNote}`;
  }
  return reason;
}

function openExternalAppraisalReasonModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const currentReason = state.fields.externalAppraisalReason || "";
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="externalAppraisalModalTitle">
      <div class="modal-head">
        <h3 id="externalAppraisalModalTitle">Dışarıdan Ekspertiz Sebebi</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <div class="radio-list">
          ${externalAppraisalReasons.map((reason) => `
            <label class="checkbox-row">
              <input type="radio" name="externalAppraisalReason" value="${escapeHtml(reason)}" ${currentReason === reason ? "checked" : ""}>
              <span>${escapeHtml(reason)}</span>
            </label>
          `).join("")}
        </div>
        <label class="field external-appraisal-other-field" ${currentReason === "Diğer" ? "" : "hidden"}>
          <span>Açıklama</span>
          <textarea data-external-appraisal-other rows="4"></textarea>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-external-appraisal-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-external-appraisal-save>Kaydet</button>
      </div>
    </div>
  `;

  const otherField = overlay.querySelector(".external-appraisal-other-field");
  const otherText = overlay.querySelector("[data-external-appraisal-other]");
  otherText.value = state.fields.externalAppraisalOtherNote || "";

  overlay.querySelectorAll("input[name='externalAppraisalReason']").forEach((input) => {
    input.addEventListener("change", () => {
      otherField.hidden = input.value !== "Diğer";
    });
  });

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-external-appraisal-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-external-appraisal-save]").addEventListener("click", () => {
    const selectedReason = overlay.querySelector("input[name='externalAppraisalReason']:checked")?.value || "";
    state.fields.appointmentType = "Dışarıdan ekspertiz";
    state.fields.externalAppraisalReason = selectedReason;
    state.fields.externalAppraisalOtherNote = selectedReason === "Diğer" ? normalizeReportDescriptionText(otherText.value) : "";
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  overlay.querySelector("input[name='externalAppraisalReason']")?.focus();
}

function openRestrictedInspectionModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="restrictedInspectionModalTitle">
      <div class="modal-head">
        <h3 id="restrictedInspectionModalTitle">Kısıtlı İnceleme Açıklaması</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>Açıklama</span>
          <textarea data-restricted-inspection-note rows="5" placeholder="Kısıtlı inceleme nedenini yazın."></textarea>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-restricted-inspection-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-restricted-inspection-save>Kaydet</button>
      </div>
    </div>
  `;

  const noteInput = overlay.querySelector("[data-restricted-inspection-note]");
  noteInput.value = state.fields.restrictedInspectionNote || "";

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-restricted-inspection-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-restricted-inspection-save]").addEventListener("click", () => {
    state.fields.appointmentType = "Kısıtlı inceleme";
    state.fields.restrictedInspectionNote = normalizeReportDescriptionText(noteInput.value);
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  noteInput.focus();
}
function createFloorHmaxPairControl() {
  const wrapper = document.createElement("div");
  wrapper.className = "field split-field-pair";

  const floorLabel = createInlineTextField({
    key: "floorCount",
    label: "Kat Adedi",
    options: imarFloorCountOptions,
  });
  const hmaxLabel = createInlineTextField({
    key: "hmax",
    label: "Hmax",
  });

  wrapper.append(floorLabel, hmaxLabel);
  return wrapper;
}

function createGardenSetbacksPairControl() {
  const wrapper = document.createElement("div");
  wrapper.className = "field split-field-pair garden-setbacks-field";

  const frontGardenLabel = createInlineTextField({
    key: "frontGarden",
    label: "Ön Bahçe",
  });
  const sideGardenLabel = createInlineTextField({
    key: "sideGarden",
    label: "Yan Bahçe",
  });

  wrapper.append(frontGardenLabel, sideGardenLabel);
  if (shouldShowPlanningIssueFields()) {
    const roadField = createRoadSetbackControl({
      key: "roadSetback",
      label: "Yola Terk Var Mı",
      options: ["", "Evet", "Hayır"],
    });
    roadField.classList.add("inline-road-setback-field");
    wrapper.append(roadField);
  }
  return wrapper;
}

function createInlineTextField(field) {
  const label = document.createElement("label");
  label.className = "inline-field";

  const span = createSpan(`${field.label}:`);
  const input = field.options ? document.createElement("select") : document.createElement("input");
  if (!field.options) input.type = "text";
  input.dataset.field = field.key;
  if (field.options) {
    const currentValue = state.fields[field.key] || "";
    const options = [...field.options];
    if (currentValue && !options.includes(currentValue)) {
      options.push(currentValue);
    }
    options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option || "Seçiniz";
      input.append(item);
    });
  }
  input.value = state.fields[field.key] || "";
  markFieldSourceState(input, field.key);

  input.addEventListener("input", (event) => {
    clearFieldSourceOwnership(field.key);
    state.fields[field.key] = event.target.value;
    refreshPlanningNoteFromCurrentFields(field.key);
    autosave();
    renderValidation();
    updateStatus();
  });

  input.addEventListener("blur", () => {
    const formattedValue = normalizeReportFieldValue(field.key, input.value);
    if (formattedValue === input.value) return;
    input.value = formattedValue;
    state.fields[field.key] = formattedValue;
    refreshPlanningNoteFromCurrentFields(field.key);
    autosave();
    renderValidation();
    updateStatus();
  });

  label.append(span, input);
  return label;
}

const titleRecordChangeOptions = [
  { key: "titlePropertyId", label: "Taşınmaz Kimlik No" },
  { key: "titleDistrict", label: "Tapu İlçe" },
  { key: "titleNeighborhood", label: "Tapu Mahalle" },
  { key: "blockNo", label: "Ada" },
  { key: "parcelNo", label: "Parsel" },
  { key: "landArea", label: "Ana Taşınmaz Yüzölçümü" },
  { key: "titleQuality", label: "Bağımsız Bölüm Niteliği" },
  { key: "titleBlockName", label: "Blok" },
  { key: "titleFloor", label: "Tapu Katı" },
  { key: "unitNo", label: "Bağımsız Bölüm No" },
  { key: "share", label: "Arsa Payı" },
  { key: "denominator", label: "Arsa Payda" },
  { key: "registryVolume", label: "Cilt" },
  { key: "registryPage", label: "Sayfa" },
  { key: "mainPropertyQuality", label: "Ana Taşınmaz Niteliği" },
  { key: "owner", label: "Malik" },
  { key: "acquisitionReason", label: "Edinme Sebebi" },
  { key: "titleDate", label: "Tapu Tarihi" },
  { key: "journalNo", label: "Yevmiye No" },
];

function createTitleRecordChangeControl(field) {
  const label = document.createElement("label");
  label.className = "field field-wide";

  const control = document.createElement("div");
  control.className = "title-record-change-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  ["", "Evet", "Hayır"].forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = normalizeYesNoChoice(state.fields.titleRecordChange);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "conditional-detail-button";
  detailButton.textContent = "Kayıt Seç";
  detailButton.disabled = select.value !== "Evet";

  const summary = document.createElement("small");
  summary.className = "conditional-summary";
  summary.textContent = formatTitleRecordChangeSummary();

  select.addEventListener("input", (event) => {
    const nextValue = normalizeYesNoChoice(event.target.value);
    state.fields.titleRecordChange = nextValue;
    select.value = nextValue;
    detailButton.disabled = nextValue !== "Evet";

    if (nextValue !== "Evet") {
      state.fields.titleChangedRecords = [];
    }

    summary.textContent = formatTitleRecordChangeSummary();
    refreshEncumbranceSummaryFromCurrentData();
    autosave();
    renderValidation();
    updateStatus();

    if (nextValue === "Evet") {
      openTitleRecordChangeModal(() => {
        summary.textContent = formatTitleRecordChangeSummary();
        refreshEncumbranceSummaryFromCurrentData();
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openTitleRecordChangeModal(() => {
      summary.textContent = formatTitleRecordChangeSummary();
      refreshEncumbranceSummaryFromCurrentData();
    });
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function getSelectedTitleRecordChangeKeys() {
  return Array.isArray(state.fields.titleChangedRecords) ? state.fields.titleChangedRecords : [];
}

function formatTitleRecordChangeSummary() {
  const value = normalizeYesNoChoice(state.fields.titleRecordChange);
  if (!value) return "Seçiniz.";
  if (value !== "Evet") return "Tapu kaydı değişikliği yok.";
  const selected = getSelectedTitleRecordChangeKeys()
    .map((key) => titleRecordChangeOptions.find((option) => option.key === key)?.label)
    .filter(Boolean);
  return selected.length ? `Seçilen kayıtlar: ${selected.join(", ")}` : "Değişiklik olan tapu kayıtları seçilmedi.";
}

function openTitleRecordChangeModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const selected = new Set(getSelectedTitleRecordChangeKeys());
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card modal-card-wide" role="dialog" aria-modal="true" aria-labelledby="titleRecordChangeModalTitle">
      <div class="modal-head">
        <h3 id="titleRecordChangeModalTitle">Tapu Kaydı Değişikliği</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-lead">Değişiklik olan Tapu Kayıtlarını seçiniz.</p>
        <div class="checkbox-list">
          ${titleRecordChangeOptions.map((option) => `
            <label class="checkbox-row">
              <input type="checkbox" value="${escapeHtml(option.key)}" ${selected.has(option.key) ? "checked" : ""}>
              <span>${escapeHtml(option.label)}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-title-change-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-title-change-save>Kaydet</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-title-change-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-title-change-save]").addEventListener("click", () => {
    state.fields.titleRecordChange = "Evet";
    state.fields.titleChangedRecords = [...overlay.querySelectorAll(".checkbox-list input:checked")].map((input) => input.value);
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    refreshEncumbranceSummaryFromCurrentData();
    close();
  });

  document.body.append(overlay);
  overlay.querySelector(".checkbox-list input")?.focus();
}

function normalizeYesNoChoice(value) {
  const text = String(value || "").trim();
  const folded = foldTurkish(text);
  if (/^(EVET|VAR|YES|TRUE|1)$/.test(folded)) return "Evet";
  if (/^(HAYIR|YOK|NO|FALSE|0)$/.test(folded)) return "Hayır";
  return "";
}

function formatRoadSetbackSummary() {
  if (state.fields.roadSetback !== "Evet") return "Seçiniz / Hayır durumunda ek bilgi alınmaz.";
  const parts = [];
  if (state.fields.roadSetbackAmount) parts.push(`Terk miktarı: ${state.fields.roadSetbackAmount}`);
  if (state.fields.roadSetbackBuildingImpact) parts.push(`Yapıya etkisi: ${state.fields.roadSetbackBuildingImpact}`);
  return parts.length ? parts.join(" - ") : "Terk detayları bekliyor.";
}

function createConditionalYesNoControl(field) {
  const label = document.createElement("label");
  label.className = "field";
  if (field.layoutClass) label.classList.add(field.layoutClass);
  label.classList.toggle("is-required", Boolean(field.required));
  label.classList.toggle("is-critical", Boolean(field.critical));
  label.classList.toggle("field-wide", Boolean(field.wide));

  const control = document.createElement("div");
  control.className = "conditional-yes-no-control";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  ["", "Evet", "Hayır"].forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  const initialValue = normalizeYesNoChoice(state.fields[field.key]) || getEffectiveDefaultValueForField(field) || "";
  if (!state.fields[field.key] && initialValue && !isFieldKeyOwnedBySource(field.key)) {
    state.fields[field.key] = initialValue;
  }
  select.value = initialValue;

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "conditional-detail-button";
  detailButton.textContent = "Açıklama";
  detailButton.disabled = !shouldOpenConditionalDetail(field, select.value);
  detailButton.hidden = Boolean(field.hideInactiveDetail && !shouldOpenConditionalDetail(field, select.value));

  const summary = document.createElement("small");
  summary.className = "conditional-summary";
  summary.textContent = formatConditionalYesNoSummary(field);
  summary.hidden = Boolean(field.hideInactiveDetail && !shouldOpenConditionalDetail(field, select.value));

  select.addEventListener("input", (event) => {
    const nextValue = normalizeYesNoChoice(event.target.value);
    state.fields[field.key] = nextValue;
    select.value = nextValue;
    detailButton.disabled = !shouldOpenConditionalDetail(field, nextValue);
    detailButton.hidden = Boolean(field.hideInactiveDetail && !shouldOpenConditionalDetail(field, nextValue));

    if (!shouldOpenConditionalDetail(field, nextValue)) {
      state.fields[field.detailKey] = "";
    }

    summary.textContent = formatConditionalYesNoSummary(field);
    summary.hidden = Boolean(field.hideInactiveDetail && !shouldOpenConditionalDetail(field, nextValue));
    refreshPlanningNoteFromCurrentFields(field.key);
    refreshPlanningNoteFromCurrentFields(field.detailKey);
    autosave();
    renderValidation();
    updateStatus();

    if (shouldOpenConditionalDetail(field, nextValue)) {
      openConditionalExplanationModal(field, () => {
        summary.textContent = formatConditionalYesNoSummary(field);
      });
    }
  });

  detailButton.addEventListener("click", () => {
    openConditionalExplanationModal(field, () => {
      summary.textContent = formatConditionalYesNoSummary(field);
    });
  });

  control.append(select, detailButton, summary);
  label.append(createSpan(field.label), control);
  return label;
}

function createMultiCheckboxControl(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "field multi-checkbox-dropdown";
  wrapper.classList.toggle("field-wide", Boolean(field.wide));
  wrapper.classList.toggle("is-critical", Boolean(field.critical));

  const options = getFieldOptions(field);
  let selected = getMultiCheckboxValues(field.key, field).filter((value) => !options.length || options.includes(value));
  if (state.fields[field.key] && selected.length !== getMultiCheckboxValues(field.key, field).length) {
    state.fields[field.key] = formatMultiCheckboxValue(selected, field);
  }
  const summaryButton = document.createElement("button");
  summaryButton.type = "button";
  summaryButton.className = "multi-checkbox-summary";
  summaryButton.setAttribute("aria-expanded", "false");
  summaryButton.textContent = formatMultiCheckboxSummary(selected, field);

  const list = document.createElement("div");
  list.className = "inline-checkbox-list";
  list.hidden = true;

  options.forEach((option) => {
    const item = document.createElement("label");
    item.className = "checkbox-row";
    item.innerHTML = `
      <input type="checkbox" value="${escapeHtml(option)}" ${selected.includes(option) ? "checked" : ""}>
      <span>${escapeHtml(option)}</span>
    `;
    list.append(item);
  });

  list.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", () => {
      let values = [...list.querySelectorAll("input[type='checkbox']:checked")].map((checkbox) => checkbox.value);
      if (field.maxSelections && values.length > field.maxSelections) {
        input.checked = false;
        values = values.filter((value) => value !== input.value);
      }
      values = normalizeMultiCheckboxValues(values, field);
      state.fields[field.key] = formatMultiCheckboxValue(values, field);
      summaryButton.textContent = formatMultiCheckboxSummary(values, field);
      refreshEnvironmentDescriptionFromCurrentFields(field.key);
      autosave();
      renderValidation();
      updateStatus();
    });
  });

  let outsideClickListener = null;
  const setOpen = (isOpen) => {
    list.hidden = !isOpen;
    wrapper.classList.toggle("is-open", isOpen);
    summaryButton.setAttribute("aria-expanded", String(isOpen));

    if (outsideClickListener) {
      document.removeEventListener("pointerdown", outsideClickListener);
      outsideClickListener = null;
    }

    if (isOpen) {
      outsideClickListener = (event) => {
        if (!wrapper.contains(event.target)) {
          setOpen(false);
        }
      };
      const currentOutsideClickListener = outsideClickListener;
      setTimeout(() => {
        if (outsideClickListener === currentOutsideClickListener) {
          document.addEventListener("pointerdown", currentOutsideClickListener);
        }
      }, 0);
    }
  };

  summaryButton.addEventListener("click", () => {
    setOpen(list.hidden);
  });

  list.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  wrapper.append(createSpan(field.label), summaryButton, list);
  return wrapper;
}

function createCheckboxControl(section, field) {
  const label = document.createElement("label");
  label.className = "field checkbox-field";
  label.classList.toggle("field-wide", Boolean(field.wide));
  label.classList.toggle("is-critical", Boolean(field.critical));

  const checkedValue = field.checkedValue || "Evet";
  const uncheckedValue = field.uncheckedValue || "Hayır";
  const effectiveDefaultValue = getEffectiveDefaultValueForField(field) || checkedValue;
  if (!state.fields[field.key] && effectiveDefaultValue && !isFieldKeyOwnedBySource(field.key)) {
    state.fields[field.key] = effectiveDefaultValue;
  }

  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.field = field.key;
  input.checked = (state.fields[field.key] || effectiveDefaultValue) === checkedValue;

  input.addEventListener("change", () => {
    clearFieldSourceOwnership(field.key);
    state.fields[field.key] = input.checked ? checkedValue : uncheckedValue;
    refreshPlanningNoteFromCurrentFields(field.key);
    refreshEnvironmentDescriptionFromCurrentFields(field.key);
    refreshReviewedDocumentsDescriptionFromCurrentFields(field.key);
    refreshEncumbranceSummaryFromCurrentFields(field.key);
    autosave();
    renderValidation();
    updateStatus();
    if (
      (section.id === "documents" && field.key === "hasArchitecturalProject")
      || (section.id === "case" && field.key === "usageNatureDifference")
      || (section.id === "planning" && field.key === "hasPlanningIssue")
    ) {
      renderSection();
    }
  });

  const text = document.createElement("span");
  text.textContent = formatUiHeading(field.label);
  label.append(input, text);
  return label;
}

function getFieldOptions(field = {}) {
  if (field.key === "regionUsePurpose" && detectEnvironmentalRegionType(state.fields.environmentRegionType) === "Sanayi Bölgesi") {
    return industrialRegionUsePurposeOptions;
  }
  return field.options || [];
}

function normalizeRegionUsePurposeForEnvironment() {
  const options = getFieldOptions({ key: "regionUsePurpose", options: regionUsePurposeOptions });
  const current = getMultiCheckboxValues("regionUsePurpose", { options: regionUsePurposeOptions });
  const next = current.filter((value) => options.includes(value));
  if (next.length !== current.length) {
    state.fields.regionUsePurpose = formatMultiCheckboxValue(next, { options });
  }
}
function getMultiCheckboxValues(key, field = {}) {
  const value = state.fields[key];
  if (Array.isArray(value)) return value;
  const separator = field.rangeSummary ? /[,;-]/ : ",";
  return normalizeMultiCheckboxValues(String(value || "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean), field);
}

function normalizeMultiCheckboxValues(values, field = {}) {
  const uniqueValues = [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
  if (!field.rangeSummary) return uniqueValues;
  return uniqueValues.sort((a, b) => Number(a) - Number(b)).slice(0, field.maxSelections || uniqueValues.length);
}

function formatMultiCheckboxValue(values, field = {}) {
  if (!values.length) return "";
  if (field.rangeSummary) return values.join("-");
  return values.join(", ");
}

function formatMultiCheckboxSummary(values, field = {}) {
  if (!values.length) return "Seçiniz";
  return formatMultiCheckboxValue(values, field);
}

function createDocumentDecisionControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "document-decision-grid";
  wrapper.append(
    createConditionalYesNoControl({
      key: "penaltyDecision",
      label: "Cezai Karar Var mı?",
      type: "conditionalYesNo",
      detailWhen: "Evet",
      detailKey: "penaltyNote",
      detailLabel: "Cezai karar açıklama",
      detailTitle: "Cezai Karar Açıklama",
      defaultValue: "Hayır",
      hideInactiveDetail: true,
    }),
    createConditionalYesNoControl({
      key: "staticSuitability",
      label: "Statik Uygunluk",
      type: "conditionalYesNo",
      detailWhen: "Hayır",
      detailKey: "staticSuitabilityNote",
      detailLabel: "Statik uygunluk açıklama",
      detailTitle: "Statik Uygunluk Açıklama",
      hideInactiveDetail: true,
    })
  );

  const contractTitle = document.createElement("h4");
  contractTitle.className = "document-decision-title";
  contractTitle.textContent = "Yapı Denetim Sözleşme Durumu";
  wrapper.append(
    contractTitle,
    createDocumentDecisionSelect({
      key: "buildingInspectionContractActive",
      label: "Sözleşme Aktif mi?",
      options: ["", "Evet", "Hayır (Fesihli)"],
      onChange: (nextValue) => {
        if (nextValue === "Hayır (Fesihli)") {
          openBuildingInspectionTerminationModal();
        } else {
          state.fields.buildingInspectionTerminationDate = "";
          state.fields.buildingInspectionTerminationLevel = "";
        }
      },
    }),
    createDocumentDecisionSelect({
      key: "buildingInspectionProgressLevel",
      label: "Yapı Denetim Hakediş Seviyesi",
      options: ["", ...Array.from({ length: 100 }, (_, index) => `%${100 - index}`)],
    })
  );
  return wrapper;
}

function createDocumentDecisionSelect(field) {
  const label = document.createElement("label");
  label.className = "field";

  const select = document.createElement("select");
  select.dataset.field = field.key;
  (field.options || []).forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    select.append(item);
  });
  select.value = field.normalize ? field.normalize(state.fields[field.key]) : state.fields[field.key] || "";

  select.addEventListener("input", (event) => {
    const nextValue = field.normalize ? field.normalize(event.target.value) : event.target.value;
    state.fields[field.key] = nextValue;
    select.value = nextValue;
    field.onChange?.(nextValue);
    autosave();
    renderValidation();
    updateStatus();
  });

  label.append(createSpan(field.label), select);
  return label;
}

function openBuildingInspectionTerminationModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="buildingInspectionTerminationModalTitle">
      <div class="modal-head">
        <h3 id="buildingInspectionTerminationModalTitle">Yapı Denetim Sözleşme Feshi</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>Sözleşme Fesih Tarihi</span>
          <input type="date" data-building-inspection-termination-date>
        </label>
        <label class="field">
          <span>Fesih Seviyesi</span>
          <select data-building-inspection-termination-level></select>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-building-inspection-termination-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-building-inspection-termination-save>Kaydet</button>
      </div>
    </div>
  `;

  const dateInput = overlay.querySelector("[data-building-inspection-termination-date]");
  const levelSelect = overlay.querySelector("[data-building-inspection-termination-level]");
  ["", ...Array.from({ length: 100 }, (_, index) => `%${100 - index}`)].forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Seçiniz";
    levelSelect.append(item);
  });
  dateInput.value = state.fields.buildingInspectionTerminationDate || "";
  levelSelect.value = state.fields.buildingInspectionTerminationLevel || "";

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-building-inspection-termination-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-building-inspection-termination-save]").addEventListener("click", () => {
    state.fields.buildingInspectionContractActive = "Hayır (Fesihli)";
    state.fields.buildingInspectionTerminationDate = dateInput.value;
    state.fields.buildingInspectionTerminationLevel = levelSelect.value;
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  dateInput.focus();
}

function shouldOpenConditionalDetail(field, value) {
  return normalizeYesNoChoice(value) === (field.detailWhen || "Evet");
}

function formatConditionalYesNoSummary(field) {
  const value = normalizeYesNoChoice(state.fields[field.key]);
  if (!value) return "Seçiniz.";
  if (!shouldOpenConditionalDetail(field, value)) return "Ek açıklama gerekmez.";
  return state.fields[field.detailKey] || "Açıklama bekliyor.";
}

function openConditionalExplanationModal(field, onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const modalTitle = field.detailTitle || field.label;
  const explanationLabel = field.detailLabel || "Açıklama";
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="conditionalModalTitle">
      <div class="modal-head">
        <h3 id="conditionalModalTitle">${escapeHtml(modalTitle)}</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>${escapeHtml(explanationLabel)}</span>
          <textarea data-conditional-explanation rows="5"></textarea>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-conditional-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-conditional-save>Kaydet</button>
      </div>
    </div>
  `;

  const explanation = overlay.querySelector("[data-conditional-explanation]");
  explanation.value = state.fields[field.detailKey] || "";

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-conditional-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-conditional-save]").addEventListener("click", () => {
    state.fields[field.key] = field.detailWhen || "Evet";
    state.fields[field.detailKey] = normalizeReportDescriptionText(explanation.value);
    refreshPlanningNoteFromCurrentFields(field.key);
    refreshPlanningNoteFromCurrentFields(field.detailKey);
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  explanation.focus();
}

function openRoadSetbackModal(onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="roadSetbackModalTitle">
      <div class="modal-head">
        <h3 id="roadSetbackModalTitle">Yola Terk Detayı</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>Terk Miktarı</span>
          <input type="text" data-road-setback-amount>
        </label>
        <label class="field">
          <span>Yapıya Etkisi Var Mı</span>
          <select data-road-setback-impact>
            <option value="">Seçiniz</option>
            <option value="Evet">Evet</option>
            <option value="Hayır">Hayır</option>
          </select>
        </label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-road-setback-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-road-setback-save>Kaydet</button>
      </div>
    </div>
  `;

  const amountInput = overlay.querySelector("[data-road-setback-amount]");
  const impactSelect = overlay.querySelector("[data-road-setback-impact]");
  amountInput.value = state.fields.roadSetbackAmount || "";
  impactSelect.value = normalizeYesNoChoice(state.fields.roadSetbackBuildingImpact);

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-road-setback-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-road-setback-save]").addEventListener("click", () => {
    state.fields.roadSetback = "Evet";
    state.fields.roadSetbackAmount = normalizeReportTitleText(amountInput.value);
    state.fields.roadSetbackBuildingImpact = normalizeYesNoChoice(impactSelect.value);
    refreshPlanningNoteFromCurrentFields("roadSetback");
    refreshPlanningNoteFromCurrentFields("roadSetbackAmount");
    refreshPlanningNoteFromCurrentFields("roadSetbackBuildingImpact");
    autosave();
    renderValidation();
    updateStatus();
    onSave();
    close();
  });

  document.body.append(overlay);
  amountInput.focus();
}

function createMainArteryComposer(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "artery-composer";
  const source = state.sourceValues.nearbyPlaces || {};
  const roads = getNearbyArteries(source.places || []);
  const selectedId = state.fields.mainArteryId || "";
  const selectedRoad = roads.find((road) => road.id === selectedId);

  wrapper.innerHTML = `
    <div class="artery-head">
      <div>
        <span>${escapeHtml(field.label)}</span>
      </div>
    </div>
    <div class="artery-selected">${selectedRoad ? escapeHtml(formatPlaceWithDistance(selectedRoad)) : state.fields.mainArtery ? escapeHtml(state.fields.mainArtery) : "Henüz ana arter seçilmedi."}</div>
    <div class="artery-list"></div>
    <label class="manual-main-artery-field">
      <span>Manuel ana arter</span>
      <input type="text" value="${selectedRoad ? "" : escapeHtml(state.fields.mainArtery || "")}" placeholder="Cadde/bulvar adını yazın" />
    </label>
  `;

  const list = wrapper.querySelector(".artery-list");
  if (!roads.length) {
    const empty = document.createElement("p");
    empty.className = "muted-note";
    empty.textContent = "1000 m içinde cadde/bulvar bulunamadı.";
    list.append(empty);
  } else {
    roads.slice(0, mainArteryAutoLimit).forEach((road) => {
      const item = document.createElement("label");
      item.className = "nearby-item artery-item";
      item.innerHTML = `
        <input type="radio" name="mainArtery" data-artery-id="${escapeHtml(road.id)}" ${selectedId === road.id ? "checked" : ""} />
        <span>${escapeHtml(formatPlaceWithDistance(road))}</span>
      `;
      list.append(item);
    });
  }

  wrapper.querySelectorAll("[data-artery-id]").forEach((input) => {
    input.addEventListener("change", () => {
      selectMainArtery(input.dataset.arteryId);
      autosave();
      renderSection();
    });
  });

  const manualInput = wrapper.querySelector(".manual-main-artery-field input");
  manualInput.addEventListener("input", () => {
    const value = normalizeReportTitleText(manualInput.value);
    state.fields.mainArteryId = "";
    state.fields.mainArtery = value;
    wrapper.querySelector(".artery-selected").textContent = value || "Henüz ana arter seçilmedi.";
    state.sourceValues.nearbyArtery = state.sourceValues.nearbyArtery || {};
    state.sourceValues.nearbyArtery.applied = {
      ...(state.sourceValues.nearbyArtery.applied || {}),
      mainArtery: value,
    };
    autosave();
    renderValidation();
    updateStatus();
  });
  manualInput.addEventListener("blur", () => {
    manualInput.value = normalizeReportTitleText(manualInput.value);
    autosave();
    renderSection();
  });

  return wrapper;
}

function createUploadGrid(uploads) {
  const grid = document.createElement("div");
  grid.className = "upload-grid";

  uploads.forEach((upload) => {
    const card = document.createElement("div");
    card.className = "upload-card";
    const stored = state.uploads[upload.id];
    const uploadError = state.uploadErrors?.[upload.id] || "";
    card.innerHTML = `
      <strong>${upload.title}</strong>
      <p>${upload.hint}</p>
      <input type="file" data-upload="${upload.id}" ${upload.accept ? `accept="${upload.accept}"` : ""} />
      <p>${stored ? `Seçilen dosya: ${stored}` : "Henüz dosya seçilmedi."}</p>
      ${uploadError ? `<p class="upload-error">${escapeHtml(uploadError)}</p>` : ""}
    `;

    card.querySelector("input").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      state.uploads[upload.id] = file.name;
      try {
        if (upload.id === "kml") {
          await processKmlFile(file);
        } else if (upload.id === "address") {
          await processAddressFile(file);
        } else if (upload.id === "ekb") {
          await processEkbFile(file);
        } else if (upload.id === "imar") {
          await processImarFile(file);
        } else if (upload.id === "takbis") {
          await processTakbisFile(file);
        }
        state.uploadErrors = { ...(state.uploadErrors || {}), [upload.id]: "" };
      } catch (error) {
        state.uploadErrors = { ...(state.uploadErrors || {}), [upload.id]: error.message || "Dosya okunamadı." };
      }
      autosave();
      renderDocuments();
      renderSection();
    });

    grid.append(card);
  });

  return grid;
}

function createLocationMapTools() {
  const wrapper = document.createElement("div");
  wrapper.className = "location-map-tools";

  const parsed = state.sourceValues.kml;
  const uploadError = state.uploadErrors?.kml;
  const conflictCount = Object.keys(state.sourceConflicts.kml || {}).length;
  const coordinateCount = parsed?.coordinates?.length || 0;
  const selectedLat = state.fields.latitude || parsed?.centroid?.lat || "40.1826";
  const selectedLng = state.fields.longitude || parsed?.centroid?.lng || "29.0665";
  const latitudeValue = state.fields.latitude || parsed?.centroid?.lat || "";
  const longitudeValue = state.fields.longitude || parsed?.centroid?.lng || "";

  wrapper.innerHTML = `
    <div class="subsection-title-row">
      <div>
        <h4>Harita ve Konum Seçimi</h4>
        <p>KML yüklendikten sonra haritadan nihai konumu işaretleyebilirsiniz.</p>
      </div>
      <label class="field compact-field map-mode-field">
        <span>Harita görünümü</span>
        <select data-map-mode>
          ${getMapModeOptionsMarkup()}
        </select>
      </label>
      <span class="export-status" data-map-export-status aria-live="polite"></span>
    </div>
    <div class="kml-summary">
      <span>${coordinateCount ? `${coordinateCount} koordinat okundu` : "KML verisi bekleniyor"}</span>
      <span>${parsed?.centroid ? `Merkez: ${parsed.centroid.lat}, ${parsed.centroid.lng}` : "Merkez koordinat yok"}</span>
      <span>${parsed?.fields?.sheetNo ? `Pafta: ${parsed.fields.sheetNo}` : "Pafta henüz okunmadı"}</span>
      <span>Seçili nokta: ${escapeHtml(selectedLat)}, ${escapeHtml(selectedLng)}</span>
      ${uploadError ? `<span class="warning-text">${escapeHtml(uploadError)}</span>` : ""}
      ${conflictCount ? `<span class="warning-text">${conflictCount} alan kullanıcı değeri nedeniyle korunuyor</span>` : ""}
    </div>
    <div class="kml-actions">
      <button class="mini-button" type="button" data-kml-map>Haritayı güncelle</button>
      <button class="mini-button" type="button" data-kml-apply>Okunan değerleri tekrar uygula</button>
      <button class="mini-button" type="button" data-map-export>HARİTAYI JPEG OLARAK KAYDET</button>
      <label class="export-control">
        <span>Boyut</span>
        <select data-map-export-ratio>
          ${getMapExportRatioOptionsMarkup()}
        </select>
      </label>
      <label class="export-check">
        <input type="checkbox" data-map-export-labels ${state.settings.mapExportLabels === false ? "" : "checked"} />
        <span>Önemli noktalar belirtilsin mi?</span>
      </label>
    </div>
    <div class="map-panel" id="kmlMapPanel">
      <div class="map-placeholder" id="kmlMapPlaceholder">KML yüklendiğinde harita burada OpenStreetMap altlığıyla gösterilecek.</div>
    </div>
    <div class="map-coordinate-fields">
      <label class="field">
        <span>Enlem</span>
        <input type="text" data-field="latitude" data-map-coordinate-field="latitude" value="${escapeHtml(latitudeValue)}" />
      </label>
      <label class="field">
        <span>Boylam</span>
        <input type="text" data-field="longitude" data-map-coordinate-field="longitude" value="${escapeHtml(longitudeValue)}" />
      </label>
    </div>
  `;

  wrapper.querySelector("[data-map-mode]").addEventListener("change", (event) => {
    state.settings.mapMode = normalizeMapMode(event.target.value);
    autosave();
    renderLeafletKmlMap();
  });

  wrapper.querySelector("[data-kml-map]").addEventListener("click", () => {
    renderLeafletKmlMap();
  });

  wrapper.querySelector("[data-kml-apply]").addEventListener("click", () => {
    applyKmlFieldsToReport({ force: true });
    autosave();
    render();
  });

  wrapper.querySelector("[data-map-export]").addEventListener("click", (event) => {
    exportMapAsJpeg(event.currentTarget);
  });

  wrapper.querySelector("[data-map-export-ratio]").addEventListener("change", (event) => {
    state.settings.mapExportRatio = event.target.value;
    autosave();
  });

  wrapper.querySelector("[data-map-export-labels]").addEventListener("change", (event) => {
    state.settings.mapExportLabels = event.target.checked;
    autosave();
  });

  wrapper.querySelectorAll("[data-map-coordinate-field]").forEach((input) => {
    const key = input.dataset.mapCoordinateField;
    markFieldSourceState(input, key);
    input.addEventListener("input", (event) => {
      clearFieldSourceOwnership(key);
      state.fields[key] = event.target.value;
      autosave();
      renderValidation();
      updateStatus();
    });
    input.addEventListener("blur", () => {
      const formattedValue = normalizeReportFieldValue(key, input.value);
      if (formattedValue !== input.value) {
        input.value = formattedValue;
        state.fields[key] = formattedValue;
        autosave();
        renderValidation();
        updateStatus();
      }
      renderLeafletKmlMap();
    });
  });

  queueMicrotask(() => {
    if (state.sourceValues.kml?.coordinates?.length) {
      renderLeafletKmlMap();
    } else {
      renderKmlMapFallback();
    }
  });

  return wrapper;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function clonePdfBuffer(buffer) {
  return buffer && typeof buffer.slice === "function" ? buffer.slice(0) : buffer;
}

function configurePdfWorker(pdfjs) {
  if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.local.js", window.location.href).href;
  }
}

function isPdfWorkerFailure(error) {
  const message = String((error && error.message) || error || "");
  return /worker|fake worker|module|script|fetch|load|network/i.test(message);
}

function formatUploadErrorDetails(upload, error) {
  const parts = [];
  const title = upload?.title || upload?.id || "Belge";
  const name = error?.name ? String(error.name) : "Hata";
  const message = error?.message ? String(error.message) : String(error || "Dosya okunamadı.");
  parts.push(`${title} okunamadı.`);
  parts.push(`${name}: ${message}`);
  if (navigator.userAgent) {
    parts.push(`Cihaz: ${navigator.userAgent}`);
  }
  if (error?.stack) {
    parts.push(String(error.stack));
  }
  return parts.filter(Boolean).join("\n").slice(0, 1800);
}
function resolvePdfLoadingTask(loadingTask) {
  if (loadingTask && loadingTask.promise) {
    return loadingTask.promise;
  }

  if (loadingTask && typeof loadingTask.then === "function") {
    return loadingTask;
  }

  throw new Error("PDF okuma işlemi başlatılamadı.");
}

function shouldDisablePdfWorkerForThisDevice() {
  const userAgent = String(navigator.userAgent || "");
  const platform = String(navigator.platform || "");
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1);
}

function shouldUsePdfTextOnlyMode() {
  return shouldDisablePdfWorkerForThisDevice();
}

function getIosPdfTextOnlyError() {
  return new Error("iOS cihazlarda OCR devre dışı. Lütfen metin katmanı olan PDF yükleyin.");
}

async function loadPdfDocument(pdfjs, buffer, options = {}) {
  configurePdfWorker(pdfjs);
  const baseOptions = { ...options };

  if (shouldDisablePdfWorkerForThisDevice()) {
    return resolvePdfLoadingTask(pdfjs.getDocument({
      ...baseOptions,
      data: clonePdfBuffer(buffer),
      disableWorker: true
    }));
  }

  try {
    return await resolvePdfLoadingTask(pdfjs.getDocument({ ...baseOptions, data: clonePdfBuffer(buffer) }));
  } catch (error) {
    if (!isPdfWorkerFailure(error)) throw error;
    return resolvePdfLoadingTask(pdfjs.getDocument({
      ...baseOptions,
      data: clonePdfBuffer(buffer),
      disableWorker: true
    }));
  }
}

async function processAddressFile(file) {
  const text = await readAddressFileText(file);
  const parsed = parseAddressCodeText(text);
  resetAddressDerivedFields();
  state.sourceValues.address = {
    fields: parsed,
    rawText: text,
    readAt: new Date().toISOString(),
    fileName: file.name,
    applied: {},
  };
  mergeLookupOptions({
    city: parsed.city,
    district: parsed.district,
    neighborhood: parsed.neighborhood,
    postalCode: parsed.postalCode,
  });
  applyAddressFieldsToReport({ force: true });
  refreshTransportAfterAddressChange();
}

async function readAddressFileText(file) {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(lowerName);

  if (isPdf) {
    const text = await readPdfText(file);
    if (text.trim()) return text;
    if (shouldUsePdfTextOnlyMode()) throw getIosPdfTextOnlyError();
    return recognizeImageText(file);
  }

  if (isImage) {
    if (shouldUsePdfTextOnlyMode()) throw getIosPdfTextOnlyError();
    return recognizeImageText(file);
  }

  throw new Error("Adres kodu için PDF veya görsel dosyası yükleyin.");
}

async function processEkbFile(file) {
  const text = await readEkbFileText(file);
  const parsed = parseEkbFields(text);
  resetEkbDerivedFields();
  state.fields.hasEkb = "Evet";
  state.sourceValues.ekb = {
    fields: parsed,
    rawText: text,
    readAt: new Date().toISOString(),
    fileName: file.name,
    applied: {},
  };
  applyEkbFieldsToReport({ force: true });
}

async function readEkbFileText(file) {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(lowerName);

  if (isPdf) {
    const text = await readCoordinatePdfText(file, 3);
    if (text.trim()) return text;
    return readPdfText(file);
  }

  if (isImage) {
    if (shouldUsePdfTextOnlyMode()) throw getIosPdfTextOnlyError();
    return recognizeImageText(file);
  }

  throw new Error("EKB için PDF veya görsel dosyası yükleyin.");
}

async function processImarFile(file) {
  const source = await readImarFileText(file);
  const text = typeof source === "string" ? source : source.text;
  const parsed = parseImarFields(text);
  resetImarDerivedFields();
  state.sourceValues.imar = {
    fields: parsed,
    rawText: text,
    readAt: new Date().toISOString(),
    fileName: file.name,
    applied: {},
    meta: typeof source === "string" ? {} : source.meta || {},
  };
  applyImarFieldsToReport({ force: true });
}

async function readImarFileText(file) {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(lowerName);

  if (isPdf) {
    const coordinateText = await readCoordinatePdfText(file, 4).catch(() => "");
    const text = await readPdfText(file).catch(() => "");
    const chunks = [];
    appendUniqueImarChunk(chunks, coordinateText);
    appendUniqueImarChunk(chunks, text);

    let ocrText = "";
    const combinedBeforeOcr = chunks.join("\n");
    const previewFields = combinedBeforeOcr.trim() ? parseImarFields(combinedBeforeOcr) : {};
    if (!shouldUsePdfTextOnlyMode() && (!hasStrongImarSignals(combinedBeforeOcr) || !previewFields.planFonk || !previewFields.insaatNizami || !previewFields.katAdedi)) {
      ocrText = await readImarPdfOcrText(file, 2).catch(() => "");
      appendUniqueImarChunk(chunks, ocrText ? `OCR:\n${ocrText}` : "");
    }

    const combined = chunks.join("\n").trim();
    if (combined) {
      return {
        text: combined,
        meta: {
          source: "pdf",
          usedOcr: Boolean(ocrText.trim()),
          coordinateLayer: Boolean(coordinateText.trim()),
          textLayer: Boolean(text.trim()),
        },
      };
    }

    if (shouldUsePdfTextOnlyMode()) throw getIosPdfTextOnlyError();
    const fallbackOcr = await readImarPdfOcrText(file, 2);
    return {
      text: fallbackOcr,
      meta: { source: "pdf", usedOcr: true, coordinateLayer: false, textLayer: false },
    };
  }

  if (isImage) {
    if (shouldUsePdfTextOnlyMode()) throw getIosPdfTextOnlyError();
    const text = await recognizeImageText(file);
    return { text, meta: { source: "image", usedOcr: true } };
  }

  throw new Error("İmar durumu için PDF veya görsel dosyası yükleyin.");
}

function appendUniqueImarChunk(chunks, text) {
  const clean = String(text || "").trim();
  if (!clean) return;
  const normalized = clean.replace(/\s+/g, " ");
  const exists = chunks.some((chunk) => {
    const current = String(chunk || "").replace(/\s+/g, " ");
    return current.includes(normalized) || normalized.includes(current);
  });
  if (!exists) chunks.push(clean);
}

function hasStrongImarSignals(text) {
  const folded = foldTurkish(text);
  const signals = [
    /IMAR\s+DURUM/,
    /PLAN\s+(ADI|FONKSIYON|TASDIK|ONAY)/,
    /T\.?\s*A\.?\s*K\.?\s*S/,
    /K\.?\s*A\.?\s*K\.?\s*S|EMSAL/,
    /INSAAT\s+NIZAM|YAPI\s+NIZAM|\bNIZAM\b/,
    /BINA\s+YUKSEKLIGI|H\s*MAX/,
    /KAT\s+ADEDI/,
    /ON\s+BAHCE|YAN\s+BAHCE|ARKA\s+BAHCE/,
  ];
  return signals.filter((pattern) => pattern.test(folded)).length >= 2;
}

async function readImarPdfOcrText(file, pageLimit = 2) {
  const pdfjs = window.pdfjsLib || globalThis.pdfjsLib;
  if (!pdfjs?.getDocument) {
    throw new Error("PDF okuyucu yüklenemedi.");
  }
  if (!window.Tesseract?.recognize) {
    throw new Error("OCR kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.");
  }

  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(pdfjs, buffer);
  const pageCount = Math.min(pdf.numPages || 1, pageLimit);
  const texts = [];

  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const canvas = await renderImarPageForOcr(pdfjs, buffer, page, pageIndex);
    if (pageIndex === 1) {
      window._imarColorCanvas = canvas;
    }
    const thresholdCanvas = thresholdImarCanvas(canvas);
    if (pageIndex === 1) {
      window._imarPageCanvas = thresholdCanvas;
    }
    const result = await Tesseract.recognize(thresholdCanvas, "tur+eng");
    const ocrText = result?.data?.text || "";
    if (ocrText.trim()) texts.push(`Sayfa ${pageIndex}\n${ocrText}`);
  }

  return texts.join("\n");
}

async function renderImarPageForOcr(pdfjs, buffer, page, pageIndex) {
  const viewport = page.getViewport({ scale: 1 });
  const maxSide = Math.max(viewport.width, viewport.height) || 1;
  const scale = Math.min(2, Math.max(1.2, 1800 / maxSide));

  try {
    const canvas = await renderPdfPageToCanvas(page, scale, 12000);
    if (isCanvasUsableForOcr(canvas)) return canvas;
    throw new Error("Imar PDF image is blank.");
  } catch (primaryError) {
    const fallbackPdf = await loadPdfDocument(pdfjs, buffer);
    const fallbackPage = await fallbackPdf.getPage(pageIndex);
    const lowCanvas = await renderPdfPageToCanvas(fallbackPage, 0.3, 8000);
    if (!isCanvasUsableForOcr(lowCanvas)) throw primaryError;
    return upscaleCanvasForOcr(lowCanvas, 4);
  }
}

function isCanvasUsableForOcr(canvas) {
  if (!canvas?.width || !canvas?.height) return false;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  const sampleWidth = Math.min(canvas.width, 240);
  const sampleHeight = Math.min(canvas.height, 240);
  const image = context.getImageData(0, 0, sampleWidth, sampleHeight);
  let dark = 0;
  let colored = 0;
  const total = image.data.length / 4;
  for (let i = 0; i < image.data.length; i += 4) {
    const gray = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
    if (gray < 245) colored += 1;
    if (gray < 210) dark += 1;
  }
  const darkRatio = dark / total;
  const coloredRatio = colored / total;
  return coloredRatio > 0.001 && darkRatio < 0.98;
}

function upscaleCanvasForOcr(sourceCanvas, factor = 4) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(sourceCanvas.width * factor));
  canvas.height = Math.max(1, Math.floor(sourceCanvas.height * factor));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function renderPdfPageToCanvas(page, scale = 1.5, timeoutMs = 12000) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const renderTask = page.render({ canvasContext: context, viewport });

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      try {
        renderTask.cancel();
      } catch (error) {
        // Rendering cancellation is best-effort; callers use the timeout rejection.
      }
      reject(new Error("İmar PDF görsel okuma zaman aşımına uğradı."));
    }, timeoutMs);

    renderTask.promise
      .then(() => {
        window.clearTimeout(timer);
        resolve(canvas);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function thresholdImarCanvas(sourceCanvas) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(sourceCanvas, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const gray = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
    const value = gray < 160 ? 0 : 255;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

async function processTakbisFile(file) {
  const parsed = await readTakbisPdf(file);
  resetTakbisTitleDerivedFields();
  state.sourceValues.takbis = {
    ...parsed,
    readAt: new Date().toISOString(),
    fileName: file.name,
    applied: {},
  };
  applyTakbisTitleFieldsToReport({ force: true });
  applyTakbisOwnersToTable(parsed.owners || []);
  applyTakbisEncumbranceFieldsToReport(parsed, { force: true });
  applyTakbisEncumbrancesToTable(parsed.encumbrances || []);
}

async function readTakbisPdf(file) {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  if (!isPdf) {
    throw new Error("TAKBİS için PDF dosyası yükleyin.");
  }

  const pdfData = await readTakbisPdfRows(file);
  let titleRaw = parseTakbisTitleRows(pdfData.rows, pdfData.pageWidth);
  let extraRows = [];
  let fields = mapTakbisTitleToReportFields(titleRaw, pdfData.rows);
  let owners = parseTakbisOwners(pdfData.rows);
  let encumbrances = parseTakbisEncumbrances(pdfData.rows, pdfData.pageWidth);

  const hasMissingLienAmount = hasTakbisAnnotationMissingLienAmount(encumbrances);
  if (!shouldUsePdfTextOnlyMode() && (isTakbisFractionFieldsMissing(fields) || !owners.length || hasMissingLienAmount)) {
    const ocrPageLimit = hasMissingLienAmount ? 8 : owners.length ? 1 : 3;
    const ocrText = await readTakbisOcrText(file, ocrPageLimit).catch(() => "");
    if (ocrText.trim()) {
      const ocrRaw = parseTakbisTitleFromText(ocrText);
      titleRaw = mergeTakbisTitleRaw(titleRaw, ocrRaw);
      fields = mapTakbisTitleToReportFields(titleRaw, pdfData.rows);
      owners = owners.length ? owners : parseTakbisOwnersFromText(ocrText);
      encumbrances = attachTakbisOcrTextToMissingLienRecords(encumbrances, ocrText);
      extraRows = ocrText
        .split(/\n+/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .map((text) => ({ page: "OCR", y: 0, text }));
    }
  }

  if (!Object.values(fields).some(Boolean)) {
    throw new Error("TAKBİS tapu kayıt bilgisi okunamadı. Farklı PDF düzeni olabilir.");
  }

  return {
    titleRaw,
    fields,
    owners,
    encumbrances,
    ownerShareWarning: getOwnerShareWarning(owners),
    rows: [
      ...pdfData.rows.map((row) => ({ page: row.page, y: row.y, text: row.text })),
      ...extraRows,
    ],
    pageWidth: pdfData.pageWidth,
  };
}

function hasTakbisAnnotationMissingLienAmount(encumbrances) {
  return (encumbrances || []).some((record) => {
    if (getEncumbranceReportTableKey(record) !== "encumbranceAnnotations") return false;
    const parsed = parseTakbisAnnotationRecord(record);
    return Boolean(parsed.__amountMissing);
  });
}

function attachTakbisOcrTextToMissingLienRecords(encumbrances, ocrText) {
  return (encumbrances || []).map((record) => {
    if (getEncumbranceReportTableKey(record) !== "encumbranceAnnotations") return record;
    const parsed = parseTakbisAnnotationRecord(record);
    return parsed.__amountMissing
      ? { ...record, _ocrText: ocrText }
      : record;
  });
}

async function readTakbisPdfRows(file) {
  if (window.pdfReady) {
    await window.pdfReady;
  }
  const pdfjs = window.pdfjsLib || globalThis.pdfjsLib;
  if (!pdfjs?.getDocument) {
    throw new Error("PDF okuma kütüphanesi yüklenemedi.");
  }

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.local.js", window.location.href).href;
  }

  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(pdfjs, buffer);
  const allItems = [];
  let pageWidth = 595;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    pageWidth = viewport.width;
    const pageHeight = viewport.height;
    const content = await page.getTextContent({ normalizeWhitespace: true });

    content.items.forEach((item) => {
      const text = (item.str || "").trim();
      if (!text) return;
      const [, b, c, d, x, y] = item.transform;
      if (Math.abs(b) > 0.3 || Math.abs(c) > 0.3) return;
      if (/BİLGİ AMAÇLIDIR|BILGI AMACLIDIR|DEVREDİLEMEZ|DEVREDILEMEZ|BU BELGE TOPLAM|tapunun kısayolu/i.test(text)) return;
      if (text.length === 1 && /[A-ZÇĞİÖŞÜ]/.test(text)) return;
      allItems.push({
        str: text,
        x,
        y: (pageNumber - 1) * pageHeight + (pageHeight - y),
        page: pageNumber,
        fs: Math.abs(d),
      });
    });
  }

  return { rows: groupPdfItemsIntoRows(allItems), pageWidth };
}

function groupPdfItemsIntoRows(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  const tolerance = 3.5;

  sorted.forEach((item) => {
    const last = rows[rows.length - 1];
    if (last && Math.abs(item.y - last.y) <= tolerance) {
      last.items.push(item);
    } else {
      rows.push({ y: item.y, page: item.page, items: [item] });
    }
  });

  rows.forEach((row) => {
    row.items.sort((a, b) => a.x - b.x);
    row.text = row.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
  });

  return rows;
}

function parseTakbisTitleRows(rows, pageWidth) {
  const bounds = findTakbisSectionBounds(rows);
  const titleRows = bounds.tapu ? rows.slice(bounds.tapu.start, bounds.tapu.end) : rows;
  const raw = extractTakbisTitleTable(titleRows, pageWidth);
  enrichTakbisTitleFromRows(raw, titleRows);
  if (!Object.values(raw).some(Boolean)) {
    return parseTakbisTitleFromText(titleRows.map((row) => row.text).join("\n"));
  }
  return raw;
}

function enrichTakbisTitleFromRows(raw, rows) {
  const text = rows.map((row) => row.text).join("\n");
  const compact = text.replace(/\s+/g, " ");
  const takePair = (patterns) => {
    for (const pattern of patterns) {
      const match = compact.match(pattern) || text.match(pattern);
      if (match?.[1] && match?.[2]) return [cleanTakbisValue(match[1]), cleanTakbisValue(match[2])];
    }
    return ["", ""];
  };
  const take = (patterns) => {
    for (const pattern of patterns) {
      const match = compact.match(pattern) || text.match(pattern);
      if (match?.[1]) return cleanTakbisValue(match[1]);
    }
    return "";
  };
  const takeNearbyValue = (labelPattern, valuePattern) => {
    const rowTexts = rows.map((row) => row.text || "");
    for (let index = 0; index < rowTexts.length; index += 1) {
      const rowText = rowTexts[index];
      if (!labelPattern.test(rowText)) continue;
      const afterLabel = rowText.slice(Math.max(rowText.search(labelPattern), 0));
      const sameLineValue = afterLabel.match(valuePattern);
      if (sameLineValue?.[1]) return cleanTakbisValue(sameLineValue[1]);
      const nextText = rowTexts.slice(index + 1, index + 4).join(" ");
      const nextValue = nextText.match(valuePattern);
      if (nextValue?.[1]) return cleanTakbisValue(nextValue[1]);
    }
    return "";
  };

  raw.Ada = raw.Ada || "";
  raw.Parsel = raw.Parsel || "";
  const [directAda, directParsel] = takePair([
    /\bAda\s*\/\s*Parsel\s*:?\s*([0-9]+)\s*\/\s*([0-9]+)/i,
    /\bAda\s*\/\s*Parsel\s*:?\s*([0-9]+)\s+([0-9]+)/i,
  ]);
  if (directAda && directParsel) {
    raw.Ada = directAda;
    raw.Parsel = directParsel;
    raw.__adaParsel = `${directAda}/${directParsel}`;
  }
  const nearbyAdaParsel = takeNearbyValue(/Ada\s*\/\s*Parsel\s*:?/i, /\b([0-9]+\s*\/\s*[0-9]+)\b/);
  if (nearbyAdaParsel) raw.__adaParsel = raw.__adaParsel || nearbyAdaParsel;

  if ((!raw.__adaParsel && (!raw.Ada || !raw.Parsel)) || raw.__adaParsel === raw.Ada) {
    const block = take([
      /\bAda\s*:?\s*([0-9]+)\b/i,
      /\bAda\s*\/\s*Parsel\s*:?\s*([0-9]+)\s*\/\s*[0-9]+/i,
    ]);
    const parcel = take([
      /\bParsel\s*:?\s*([0-9]+)\b/i,
      /\bAda\s*\/\s*Parsel\s*:?\s*[0-9]+\s*\/\s*([0-9]+)/i,
    ]);
    if (block && parcel) raw.__adaParsel = `${block}/${parcel}`;
  }

  const [directShare, directDenominator] = takePair([
    /Arsa\s*Pay(?:ı|i)?\s*\/\s*Payda\s*:?\s*([0-9]+)\s*[\/⁄∕]\s*([0-9]+)/i,
    /Arsa\s*Pay(?:ı|i)?\s*\/\s*Payda\s*:?\s*([0-9]+)\s+([0-9]+)/i,
    /Arsa\s*Pay(?:ı|i)?\s*:?\s*([0-9]+)\s+Payda\s*:?\s*([0-9]+)/i,
  ]);
  if (directShare && directDenominator) {
    raw["Arsa Pay/Payda"] = `${directShare}/${directDenominator}`;
  }
  raw["Arsa Pay/Payda"] = raw["Arsa Pay/Payda"] ||
    takeNearbyValue(/Arsa\s*Pay(?:ı|i)?\s*\/\s*Payda\s*:?/i, /\b([0-9]+\s*\/\s*[0-9]+)\b/);

  raw["Arsa Pay/Payda"] = raw["Arsa Pay/Payda"] || take([
    /Arsa\s*Pay(?:ı|i)?\s*\/\s*Payda\s*:?\s*([0-9]+(?:\s*[\/⁄∕]\s*[0-9]+)?)/i,
    /Arsa\s*Pay(?:ı|i)?\s*:?\s*([0-9]+)\s+Payda\s*:?\s*([0-9]+)/i,
  ]).replace(/\s+/g, "");
  if (raw["Arsa Pay/Payda"] && !raw["Arsa Pay/Payda"].includes("/") && /Payda/i.test(compact)) {
    const pair = compact.match(/Arsa\s*Pay(?:ı|i)?\s*:?\s*([0-9]+)\s+Payda\s*:?\s*([0-9]+)/i);
    if (pair) raw["Arsa Pay/Payda"] = `${pair[1]}/${pair[2]}`;
  }

  const [directVolume, directPage] = takePair([
    /Cilt\s*\/\s*Sayfa\s*No\s*:?\s*([0-9]+)\s*[\/⁄∕]\s*([0-9]+)/i,
    /Cilt\s*\/\s*Sayfa\s*No\s*:?\s*([0-9]+)\s+([0-9]+)/i,
    /Cilt\s*:?\s*([0-9]+)\s+Sayfa\s*:?\s*([0-9]+)/i,
  ]);
  if (directVolume && directPage) {
    raw.Cilt = directVolume;
    raw.Sayfa = directPage;
    raw.__ciltSayfa = `${directVolume}/${directPage}`;
  }
  raw.__ciltSayfa = raw.__ciltSayfa ||
    takeNearbyValue(/Cilt\s*\/\s*Sayfa\s*No\s*:?/i, /\b([0-9]+\s*\/\s*[0-9]+)\b/);

  raw.__ciltSayfa = raw.__ciltSayfa || take([
    /Cilt\s*\/\s*Sayfa\s*No\s*:?\s*([0-9]+(?:\s*[\/⁄∕]\s*[0-9]+)?)/i,
    /Cilt\s*:?\s*([0-9]+)\s+Sayfa\s*:?\s*([0-9]+)/i,
  ]).replace(/\s+/g, "");
  if (raw.__ciltSayfa && !raw.__ciltSayfa.includes("/") && /Sayfa/i.test(compact)) {
    const pair = compact.match(/Cilt\s*:?\s*([0-9]+)\s+Sayfa\s*:?\s*([0-9]+)/i);
    if (pair) raw.__ciltSayfa = `${pair[1]}/${pair[2]}`;
  }

  const exactCiltRow = rows
    .map((row) => row.text || "")
    .find((rowText) => /Cilt\s*\/\s*Sayfa\s*No/i.test(rowText) && /\b[0-9]+\s*[\/⁄∕]\s*[0-9]+\b/.test(rowText));
  const exactCiltMatch = exactCiltRow?.match(/Cilt\s*\/\s*Sayfa\s*No\s*:?\s*([0-9]+)\s*[\/⁄∕]\s*([0-9]+)/i);
  if (exactCiltMatch) {
    raw.Cilt = cleanTakbisValue(exactCiltMatch[1]);
    raw.Sayfa = cleanTakbisValue(exactCiltMatch[2]);
    raw.__ciltSayfa = `${raw.Cilt}/${raw.Sayfa}`;
  }

  if ((!raw.Ada || !raw.Parsel) && raw.__adaParsel) {
    const [ada, parsel] = splitFirst(raw.__adaParsel, "/");
    raw.Ada = raw.Ada || ada;
    raw.Parsel = raw.Parsel || parsel;
  }

  if ((!raw.Cilt || !raw.Sayfa) && raw.__ciltSayfa) {
    const [volume, page] = splitFirst(raw.__ciltSayfa, "/");
    raw.Cilt = raw.Cilt || volume;
    raw.Sayfa = raw.Sayfa || page;
  }
}

function findTakbisSectionBounds(rows) {
  const sectionPatterns = {
    tapu: /TAPU\s+KAYIT\s+BILGISI/,
    serh: /TASINMAZA\s+AIT\s+SERH|SERH\s+BEYAN\s+IRTIFAK/,
    malik: /MULKIYET\s+BILGILERI/,
    rehin: /MULKIYETE\s+AIT\s+REHIN/,
    ipotek: /IPOTEK\s+BILGILERI/,
  };
  const found = {};

  rows.forEach((row, index) => {
    const text = foldTurkish(row.text);
    Object.entries(sectionPatterns).forEach(([key, pattern]) => {
      if (!found[key] && pattern.test(text)) found[key] = index;
    });
  });

  const keys = Object.keys(found).sort((a, b) => found[a] - found[b]);
  const bounds = {};
  keys.forEach((key, index) => {
    bounds[key] = {
      start: found[key],
      end: index + 1 < keys.length ? found[keys[index + 1]] : rows.length,
    };
  });
  return bounds;
}

function extractTakbisTitleTable(rows, pageWidth) {
  const splitX = Math.min(pageWidth * 0.55, 400);
  const raw = {};
  let lastLeft = "";
  let lastRight = "";
  const labelMap = {
    "ZEMIN TIPI": "Zemin Tipi",
    "TASINMAZ KIMLIK NO": "Taşınmaz Kimlik No",
    "IL/ILCE": "__ilIlce",
    "KURUM ADI": "Kurum Adı",
    "MAHALLE/KOY ADI": "Mahalle",
    "MEVKII": "Mevkii",
    "MEVKI": "Mevkii",
    "CILT/SAYFA NO": "__ciltSayfa",
    "KAYIT DURUMU": "Kayıt Durumu",
    "KAYIT DURUM": "Kayıt Durumu",
    "ADA/PARSEL": "__adaParsel",
    "AT YUZOLCUM(M2)": "Yüzölçüm (m²)",
    "AT YUZOLCUM (M2)": "Yüzölçüm (m²)",
    "BAGIMSIZ BOLUM NITELIK": "Bağımsız Bölüm Nitelik",
    "BAGIMSIZ BOLUM BRUT YUZOLCUMU": "BB Brüt Yüzölçüm (m²)",
    "BAGIMSIZ BOLUM NET YUZOLCUMU": "BB Net Yüzölçüm (m²)",
    "BLOK/KAT/GIRIS/BBNO": "Blok/Kat/Giriş/BBNo",
    "ARSA PAY/PAYDA": "Arsa Pay/Payda",
    "ANA TASINMAZ NITELIK": "Ana Taşınmaz Nitelik",
  };
  const normalizeLabel = (value) => foldTurkish(value).replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim();

  const processCell = (text, side) => {
    if (!text) return;
    const colonPositions = [...text].map((char, index) => (char === ":" ? index : -1)).filter((index) => index >= 0);
    if (!colonPositions.length) {
      const lastField = side === "left" ? lastLeft : lastRight;
      if (lastField && (lastField === "Ana Taşınmaz Nitelik" || lastField === "Bağımsız Bölüm Nitelik" || !raw[lastField])) {
        raw[lastField] = `${raw[lastField] || ""} ${text}`.replace(/\s+/g, " ").trim();
      }
      return;
    }

    let cursor = 0;
    colonPositions.forEach((colonPosition, index) => {
      const nextColon = index + 1 < colonPositions.length ? colonPositions[index + 1] : text.length;
      const before = text.slice(cursor, colonPosition).trim().split(/\s+/).filter(Boolean);
      const after = text.slice(colonPosition + 1, nextColon).trim();
      let field = "";

      for (let wordCount = Math.min(5, before.length); wordCount >= 1; wordCount -= 1) {
        const candidate = normalizeLabel(before.slice(-wordCount).join(" "));
        if (labelMap[candidate]) {
          field = labelMap[candidate];
          break;
        }
      }
      if (!field) {
        cursor = colonPosition + 1;
        return;
      }

      let value = after;
      if (index + 1 < colonPositions.length) {
        const afterWords = after.split(/\s+/).filter(Boolean);
        for (let wordCount = Math.min(5, afterWords.length); wordCount >= 1; wordCount -= 1) {
          const candidate = normalizeLabel(afterWords.slice(-wordCount).join(" "));
          if (labelMap[candidate]) {
            value = afterWords.slice(0, -wordCount).join(" ").trim();
            break;
          }
        }
      }

      if (!raw[field]) raw[field] = cleanTakbisValue(value);
      if (side === "left") lastLeft = field;
      if (side === "right") lastRight = field;
      cursor = colonPosition + 1;
    });
  };

  rows.forEach((row) => {
    const left = row.items.filter((item) => item.x < splitX).sort((a, b) => a.x - b.x).map((item) => item.str).join(" ");
    const right = row.items.filter((item) => item.x >= splitX).sort((a, b) => a.x - b.x).map((item) => item.str).join(" ");
    processCell(left.replace(/\s+/g, " ").trim(), "left");
    processCell(right.replace(/\s+/g, " ").trim(), "right");
  });

  const [city, district] = splitFirst(raw.__ilIlce, "/");
  const [blockNo, parcelNo] = splitFirst(raw.__adaParsel, "/");
  const [registryVolume, registryPage] = splitFirst(raw.__ciltSayfa, "/");

  return {
    "Zemin Tipi": raw["Zemin Tipi"] || "",
    "Taşınmaz Kimlik No": raw["Taşınmaz Kimlik No"] || "",
    "İl": city,
    "İlçe": district,
    "Mahalle": raw.Mahalle || "",
    "Mevkii": raw.Mevkii || "",
    "Ada": blockNo,
    "Parsel": parcelNo,
    "Yüzölçüm (m²)": raw["Yüzölçüm (m²)"] || "",
    "Bağımsız Bölüm Nitelik": raw["Bağımsız Bölüm Nitelik"] || "",
    "BB Brüt Yüzölçüm (m²)": raw["BB Brüt Yüzölçüm (m²)"] || "",
    "BB Net Yüzölçüm (m²)": raw["BB Net Yüzölçüm (m²)"] || "",
    "Blok/Kat/Giriş/BBNo": normalizeSlash(raw["Blok/Kat/Giriş/BBNo"] || ""),
    "Arsa Pay/Payda": normalizeSlash(raw["Arsa Pay/Payda"] || ""),
    "Cilt": registryVolume,
    "Sayfa": registryPage,
    "Ana Taşınmaz Nitelik": raw["Ana Taşınmaz Nitelik"] || "",
    "Kayıt Durumu": (raw["Kayıt Durumu"] || "").split(/\s+/)[0] || "",
    "Kurum Adı": raw["Kurum Adı"] || "",
  };
}

function parseTakbisTitleFromText(text) {
  const value = (pattern) => {
    const match = String(text || "").match(pattern);
    return match ? cleanTakbisValue(match[1]) : "";
  };
  const raw = {
    "__ilIlce": value(/[İI]l\s*\/\s*[İI]l[çc]e\s*[:\s]\s*([A-ZÇĞİÖŞÜ/ ]+)/i),
    "__adaParsel": value(/Ada\s*\/\s*Parsel\s*[:\s]\s*([\d/]+)/i),
    "__ciltSayfa": value(/Cilt\s*\/\s*Sayfa\s*No\s*[:\s]\s*([\d/]+)/i),
    "Zemin Tipi": value(/Zemin\s*Tipi\s*[:\s]\s*([^\n]+)/i).split(/Ada\s*\/\s*Parsel/i)[0],
    "Taşınmaz Kimlik No": value(/Taşınmaz\s*Kimlik\s*No\s*[:\s]\s*(\d+)/i),
    "Mahalle": value(/Mahalle\s*\/\s*Köy\s*Adı\s*[:\s]\s*([^\n]+)/i),
    "Mevkii": value(/Mevki+i?\s*[:\s]\s*([^\n]+)/i).split(/Cilt\s*\/\s*Sayfa/i)[0],
    "Bağımsız Bölüm Nitelik": value(/Bağımsız\s*Bölüm\s*Nitelik\s*[:\s]\s*([^\n]+)/i),
    "Blok/Kat/Giriş/BBNo": value(/Blok\s*\/\s*Kat\s*\/\s*Giriş\s*\/\s*BBNo\s*[:\s]\s*([^\n]+)/i),
    "Arsa Pay/Payda": value(/Arsa\s*Pay\s*\/\s*Payda\s*[:\s]\s*([\d/]+)/i),
    "Ana Taşınmaz Nitelik": value(/Ana\s*Taşınmaz\s*Nitelik\s*[:\s]\s*([^\n]+)/i),
  };
  const [city, district] = splitFirst(raw.__ilIlce, "/");
  const [blockNo, parcelNo] = splitFirst(raw.__adaParsel, "/");
  const [registryVolume, registryPage] = splitFirst(raw.__ciltSayfa, "/");
  return {
    ...raw,
    "İl": city,
    "İlçe": district,
    "Ada": blockNo,
    "Parsel": parcelNo,
    "Cilt": registryVolume,
    "Sayfa": registryPage,
    "Zemin Tipi": cleanTakbisValue(raw["Zemin Tipi"]),
    "Mevkii": cleanTakbisValue(raw.Mevkii),
  };
}

function isTakbisFractionFieldsMissing(fields) {
  return !fields.blockNo ||
    !fields.parcelNo ||
    !fields.share ||
    !fields.denominator ||
    !fields.registryVolume ||
    !fields.registryPage;
}

function mergeTakbisTitleRaw(primary, fallback) {
  const merged = { ...primary };
  Object.entries(fallback || {}).forEach(([key, value]) => {
    if (!merged[key] && value) merged[key] = value;
  });
  return merged;
}

function mapTakbisTitleToReportFields(tapu, rows = []) {
  const blockInfo = parseTakbisBlockFloorUnit(tapu["Blok/Kat/Giriş/BBNo"]);
  const groundType = cleanTakbisValue(tapu["Zemin Tipi"] || "");
  const isMainPropertyGround = /ANATASINMAZ|ANA\s*TASINMAZ/i.test(foldTurkish(groundType));
  const share = isMainPropertyGround ? ["1", "1"] : splitFirst(tapu["Arsa Pay/Payda"], "/");
  const reportDateInfo = extractTakbisReportDateTime(rows);
  const titleDateInfo = extractTakbisTitleDateAndJournal(rows);
  return {
    takbisReportDate: reportDateInfo.date,
    takbisReportTime: reportDateInfo.time,
    groundType,
    titleQuality: cleanTakbisQuality(tapu["Bağımsız Bölüm Nitelik"] || tapu["Ana Taşınmaz Nitelik"] || ""),
    titlePropertyId: tapu["Taşınmaz Kimlik No"] || "",
    titleCity: toTitleCaseTr(tapu["İl"] || ""),
    titleDistrict: toTitleCaseTr(tapu["İlçe"] || ""),
    titleNeighborhood: toTitleCaseTr(tapu.Mahalle || ""),
    locationName: cleanTakbisValue(tapu.Mevkii || ""),
    blockNo: tapu.Ada || "",
    parcelNo: tapu.Parsel || "",
    titleBlockName: blockInfo.blockName,
    titleFloor: blockInfo.floor,
    unitNo: blockInfo.unitNo,
    share: share[0],
    denominator: share[1],
    landArea: tapu["Yüzölçüm (m²)"] || "",
    registryVolume: tapu.Cilt || "",
    registryPage: tapu.Sayfa || "",
    mainPropertyQuality: tapu["Ana Taşınmaz Nitelik"] || "",
    titleDate: titleDateInfo.date,
    journalNo: titleDateInfo.journalNo,
  };
}

function extractTakbisReportDateTime(rows) {
  const text = (rows || []).map((row) => row.text || "").join("\n");
  const match = text.match(/Tarih\s*:?\s*(\d{1,2})[-.](\d{1,2})[-.](\d{4})[-\s]+(\d{1,2}:\d{2})/i);
  if (!match) return { date: "", time: "" };
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  const time = match[4].padStart(5, "0");
  return { date: `${year}-${month}-${day}`, time };
}

function parseTakbisBlockFloorUnit(value) {
  const rawParts = normalizeSlash(value).split("/").map((part) => cleanTakbisValue(part));
  const parts = rawParts.filter((part) => part && part !== "-");
  const hasStructuredSlots = rawParts.length >= 4;
  const cleanSlot = (index) => {
    const slot = cleanTakbisValue(rawParts[index] || "");
    return slot === "-" ? "" : slot;
  };
  const blockName = hasStructuredSlots ? cleanSlot(0) : (parts.length >= 3 ? parts[0] : "");
  const floor = hasStructuredSlots ? cleanSlot(1) : (
    parts.find((part) => /(?:normal|kat|zemin|bodrum|asma|teras|\d+\.?\s*(?:normal|kat)?)/i.test(part)) ||
    (parts.length >= 2 ? parts[parts.length - 2] : "")
  );
  return {
    blockName,
    floor,
    unitNo: parts.length ? parts[parts.length - 1] : "",
  };
}

function extractTakbisTitleDateAndJournal(rows) {
  const sectionRows = getTakbisSectionRows(rows, "malik");
  const texts = (sectionRows.length ? sectionRows : rows).map((row) => row.text);
  for (let index = 0; index < texts.length; index += 1) {
    const text = texts[index];
    const match = text.match(/\b(\d{2})[-.](\d{2})[-.](\d{4})\b(?:\s+\d{1,2}:\d{2})?(?:\s*[-–—]\s*|\s+)([0-9]{3,})\b/);
    if (match) {
      return { date: `${match[3]}-${match[2]}-${match[1]}`, journalNo: match[4] };
    }

    const dateOnly = text.match(/\b(\d{2})[-.](\d{2})[-.](\d{4})\b/);
    if (dateOnly) {
      const nextText = texts.slice(index + 1, index + 4).join(" ");
      const journalMatch = nextText.match(/\b([0-9]{3,})\b/);
      return {
        date: `${dateOnly[3]}-${dateOnly[2]}-${dateOnly[1]}`,
        journalNo: journalMatch ? journalMatch[1] : "",
      };
    }
  }
  return { date: "", journalNo: "" };
}

function getTakbisSectionRows(rows, sectionKey) {
  if (sectionKey === "malik") return getTakbisOwnerSectionRows(rows);
  const bounds = findTakbisSectionBounds(rows);
  const bound = bounds[sectionKey];
  return bound ? rows.slice(bound.start, bound.end) : [];
}

function getTakbisOwnerSectionRows(rows) {
  const start = rows.findIndex((row) => /MULKIYET\s+BILGILERI/.test(foldTurkish(row.text)));
  if (start < 0) return [];
  const stopPattern = /MULKIYETE\s+AIT\s+SERH|TASINMAZA\s+AIT\s+SERH|SERH\s+BEYAN\s+IRTIFAK|MULKIYETE\s+AIT\s+REHIN|IPOTEK\s+BILGILERI|IPOTEGIN\s+KONULDUGU/i;
  const end = rows.findIndex((row, index) => index > start && stopPattern.test(foldTurkish(row.text)));
  return rows.slice(start, end > start ? end : rows.length);
}

function parseTakbisEncumbrances(rows, pageWidth = 842) {
  const groups = getTakbisEncumbranceGroups(rows);

  const records = groups
    .flatMap((group) => parseTakbisEncumbranceRows(group.rows, group.key, pageWidth))
    .flatMap(expandTakbisEmbeddedMortgageAnnotations)
    .filter((record) => (record.type || record.description || record.date || record.journalNo) && !isTakbisEncumbranceNoiseRecord(record));

  return dedupeTakbisEncumbrances(records);
}

function getTakbisEncumbranceGroups(rows) {
  const sourceRows = rows || [];
  const starts = [];
  const definitions = [
    { key: "serh", pattern: /TASINMAZA\s+AIT\s+SERH|MULKIYETE\s+AIT\s+SERH/ },
    { key: "rehin", pattern: /MULKIYETE\s+AIT\s+REHIN/ },
    { key: "ipotek", pattern: /IPOTEK\s+BILGILERI|IPOTEGIN\s+KONULDUGU/ },
  ];

  sourceRows.forEach((row, index) => {
    const folded = foldTurkish(row?.text || "");
    const match = definitions.find((definition) => definition.pattern.test(folded));
    if (!match) return;
    const previous = starts[starts.length - 1];
    if (previous && previous.key === match.key && index - previous.index <= 2) return;
    starts.push({ key: match.key, index });
  });

  if (!starts.length) {
    return [
      { key: "serh", rows: getTakbisSectionRows(sourceRows, "serh") },
      { key: "rehin", rows: getTakbisSectionRows(sourceRows, "rehin") },
      { key: "ipotek", rows: getTakbisSectionRows(sourceRows, "ipotek") },
    ].filter((group) => group.rows.length);
  }

  return starts.map((start, startIndex) => {
    const nextSectionIndex = startIndex + 1 < starts.length ? starts[startIndex + 1].index : sourceRows.length;
    const ownerStart = sourceRows.findIndex((row, index) => {
      if (index <= start.index || index >= nextSectionIndex) return false;
      return /MULKIYET\s+BILGILERI/.test(foldTurkish(row?.text || ""));
    });
    const end = ownerStart > start.index ? ownerStart : nextSectionIndex;
    return { key: start.key, rows: sourceRows.slice(start.index, end) };
  }).filter((group) => group.rows.length);
}

function parseTakbisEncumbranceRows(rows, sectionKey, pageWidth = 842) {
  if (!rows?.length) return [];
  const layout = inferTakbisEncumbranceLayout(rows, pageWidth);
  const entries = rows.map((row) => {
    const rowText = row?.text || "";
    if (!rowText || isTakbisEncumbranceHeaderRow(rowText)) return null;
    const cells = splitTakbisEncumbranceCells(row, layout);
    const type = getTakbisEncumbranceStartType(cells.type);
    const hasContent = Boolean(type || cells.type || cells.description || cells.dateJournal || rowText);
    return hasContent ? { row, cells, type } : null;
  }).filter(Boolean);

  const scopes = buildTakbisEncumbranceScopes(entries, sectionKey);

  const records = scopes.map((recordScope) => {
    const scope = recordScope.entries.slice(0, 35);
    const descriptionParts = [];
    const dateParts = [];

    scope.forEach((entry, scopeIndex) => {
      const descriptionText = getTakbisEncumbranceScopeDescription(entry, scopeIndex === 0);
      if (descriptionText) descriptionParts.push(descriptionText);
      if (entry.cells.dateJournal) dateParts.push(entry.cells.dateJournal);
    });

    let description = stripTakbisEncumbranceLeadingTypeNoise(cleanTakbisEncumbranceText(descriptionParts.join(" ")));
    let dateInfo = extractTakbisEncumbranceDateInfo(dateParts.join(" "));

    if (!description) {
      description = extractTakbisEncumbranceDescriptionFromScope(scope, recordScope.type);
    }
    if (!dateInfo.date && !dateInfo.journalNo) {
      dateInfo = extractTakbisEncumbranceDateInfo(scope.map((entry) => entry.row?.text || "").join(" "));
    }

    return {
      type: recordScope.type || normalizeTakbisEncumbranceType("", sectionKey),
      description,
      date: dateInfo.date,
      journalNo: dateInfo.journalNo,
      rawText: cleanTakbisEncumbranceText(scope.map((entry) => entry.row?.text || "").join(" ")),
    };
  }).filter((record) => record.type || record.description || record.date || record.journalNo);

  return records;
}

function buildTakbisEncumbranceScopes(entries, sectionKey) {
  const scopes = [];
  let current = null;

  const openScope = (entry) => {
    current = {
      type: entry.type || normalizeTakbisEncumbranceType("", sectionKey),
      entries: [entry],
    };
    scopes.push(current);
  };

  entries.forEach((entry) => {
    if (!current) {
      if (entry.type || sectionKey === "rehin" || sectionKey === "ipotek") {
        openScope(entry);
      }
      return;
    }

    const currentType = foldTurkish(current?.type || "");
    const nextType = foldTurkish(entry.type || "");
    if (sectionKey === "ipotek" && entry.type && currentType.includes("IPOTEK") && !nextType.includes("IPOTEK")) {
      openScope(entry);
      return;
    }

    if (entry.type && shouldStartNewTakbisEncumbranceScope(current, entry)) {
      openScope(entry);
      return;
    }

    current.entries.push(entry);
  });

  return scopes;
}

function expandTakbisEmbeddedMortgageAnnotations(record) {
  if (getEncumbranceReportTableKey(record) !== "encumbranceMortgages") return [record];

  const rawText = cleanTakbisEncumbranceText(record?.rawText || record?.description || "");
  const splitIndex = findTakbisEmbeddedMortgageAnnotationIndex(rawText);
  if (splitIndex < 0) return [record];

  const mortgageText = rawText.slice(0, splitIndex).trim();
  const embeddedText = rawText.slice(splitIndex).trim();
  const annotation = parseTakbisEmbeddedMortgageAnnotation(embeddedText, record);
  const mortgageDateInfo = extractTakbisEncumbranceDateInfo(mortgageText);
  const mortgageRecord = {
    ...record,
    description: sliceBeforeFolded(record.description || mortgageText, /REHINE\s+AIT\s+SERH|150\s*\/?\s*C\s*(?:MD|MADDE|SERH|SERHI)/),
    date: mortgageDateInfo.date || record.date || "",
    journalNo: mortgageDateInfo.journalNo || record.journalNo || "",
    rawText: mortgageText || record.rawText,
  };

  return annotation ? [mortgageRecord, annotation] : [mortgageRecord];
}

function findTakbisEmbeddedMortgageAnnotationIndex(value) {
  const text = String(value || "");
  const folded = foldTurkish(text);
  const patterns = [
    /REHINE\s+AIT\s+SERH\s+BEYAN\s+BILGISI/,
    /\b(?:SERH|BEYAN|IRTIFAK)\b\s+[^]{0,80}\b150\s*\/?\s*C\b/,
    /\b150\s*\/?\s*C\s*(?:MD|MADDE|SERH|SERHI)\b/,
  ];

  for (const pattern of patterns) {
    const match = folded.match(pattern);
    if (match) return match.index;
  }
  return -1;
}

function parseTakbisEmbeddedMortgageAnnotation(value, parentRecord = {}) {
  const raw = cleanTakbisEncumbranceText(value);
  if (!raw) return null;
  const folded = foldTurkish(raw);
  const type = /BEYAN/.test(folded) && !/SERH/.test(folded) ? "Beyan" : "Şerh";
  const dateInfo = extractTakbisEncumbranceDateInfo(raw);
  const description = cleanTakbisEmbeddedMortgageAnnotationDescription(raw, dateInfo);
  if (!description) return null;
  return {
    type,
    description,
    date: dateInfo.date || parentRecord.date || "",
    journalNo: dateInfo.journalNo || parentRecord.journalNo || "",
    rawText: raw,
  };
}

function cleanTakbisEmbeddedMortgageAnnotationDescription(value, dateInfo = {}) {
  let text = cleanTakbisEncumbranceText(value)
    .replace(/Rehine\s+Ait\s+Şerh\s+Beyan\s+Bilgisi/gi, " ")
    .replace(/Rehine\s+Ait\s+Serh\s+Beyan\s+Bilgisi/gi, " ")
    .replace(/\b(?:Ş\/B\/İ|S\/B\/I|Açıklama|Aciklama|Malik|Tarih\s*-\s*Yevmiye|Terkin\s*Sebebi)\b/gi, " ")
    .replace(/^(?:Şerh|Serh|Beyan|İrtifak|Irtifak)\s+/i, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tailDatePattern = /\b[A-Za-zÇĞİÖŞÜçğıöşü]+\s*-\s*\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}(?:\s+\d{1,2}:\d{2})?\s*[-–—]\s*\d{3,8}\b\s*$/i;
  text = text.replace(tailDatePattern, "").trim();
  if (dateInfo.date && dateInfo.journalNo) {
    const [day, month, year] = dateInfo.date.split(".");
    const datePattern = new RegExp(`\\b[A-Za-zÇĞİÖŞÜçğıöşü]+\\s*-\\s*${day}[-.\\/]${month}[-.\\/]${year}(?:\\s+\\d{1,2}:\\d{2})?\\s*[-–—]\\s*${dateInfo.journalNo}\\b\\s*$`, "i");
    text = text.replace(datePattern, "").trim();
  }

  return stripTakbisEncumbranceLeadingTypeNoise(text)
    .replace(/\s+/g, " ")
    .trim();
}

function shouldStartNewTakbisEncumbranceScope(currentScope, entry) {
  const currentEntries = currentScope?.entries || [];
  if (!currentEntries.length) return true;
  if (hasCompleteTakbisEncumbranceDateInfo(currentEntries)) return true;

  const lastEntry = currentEntries[currentEntries.length - 1];
  const rowGap = Math.abs((entry?.row?.y || 0) - (lastEntry?.row?.y || 0));
  const hasExistingDescription = currentEntries.some((item, index) => getTakbisEncumbranceScopeDescription(item, index === 0));
  if (hasExistingDescription && rowGap > 20) return true;

  return false;
}

function hasCompleteTakbisEncumbranceDateInfo(entries) {
  const dateText = (entries || [])
    .map((entry) => entry.cells?.dateJournal || "")
    .filter(Boolean)
    .join(" ");
  const dateInfo = extractTakbisEncumbranceDateInfo(dateText);
  return Boolean(dateInfo.date && dateInfo.journalNo);
}

function inferTakbisEncumbranceLayout(rows, pageWidth = 842) {
  const headerItems = [];
  (rows || []).forEach((row) => {
    const folded = foldTurkish(row?.text || "");
    if (/S\/B\/I|ACIKLAMA|MALIK\/LEHTAR|TESIS\s+KURUM|TERKIN\s+SEBEBI/.test(folded)) {
      (row.items || []).forEach((item) => {
        headerItems.push({ x: Number(item.x) || 0, text: foldTurkish(item.str || "") });
      });
    }
  });

  const firstX = (pattern) => {
    const item = headerItems
      .filter((candidate) => pattern.test(candidate.text))
      .sort((a, b) => a.x - b.x)[0];
    return item ? item.x : null;
  };

  const typeX = firstX(/S\/B\/I|SERH|BEYAN|IRTIFAK/) ?? pageWidth * 0.11;
  const descX = firstX(/ACIKLAMA/) ?? pageWidth * 0.36;
  const restrictedOwnerX = firstX(/KISITLI|HISSE/);
  const malikX = firstX(/MALIK|LEHTAR/) ?? pageWidth * 0.53;
  const tesisX = firstX(/TESIS|TERKIN/) ?? pageWidth * 0.78;

  const typeEnd = clampNumber((typeX + descX) / 2, pageWidth * 0.12, pageWidth * 0.26);
  const descBoundaryX = restrictedOwnerX && restrictedOwnerX > descX ? restrictedOwnerX : malikX;
  const descEnd = clampNumber(descBoundaryX - 14, pageWidth * 0.38, pageWidth * 0.62);
  const dateStart = clampNumber(tesisX - 12, pageWidth * 0.72, pageWidth * 0.88);
  return { typeEnd, descEnd, dateStart };
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function splitTakbisEncumbranceCells(row, layout) {
  const cells = { type: "", description: "", dateJournal: "" };
  (row.items || []).forEach((item) => {
    const text = cleanTakbisEncumbranceText(item.str);
    if (!text) return;
    if (item.x < layout.typeEnd) {
      cells.type = `${cells.type} ${text}`.trim();
    } else if (item.x >= layout.dateStart) {
      cells.dateJournal = `${cells.dateJournal} ${text}`.trim();
    } else if (item.x < layout.descEnd) {
      cells.description = `${cells.description} ${text}`.trim();
    }
  });
  return cells;
}

function getTakbisEncumbranceScopeDescription(entry, isStartRow = false) {
  const parts = [];
  const typeCell = cleanTakbisEncumbranceText(entry?.cells?.type || "");
  const descriptionCell = cleanTakbisEncumbranceText(entry?.cells?.description || "");

  if (typeCell && !entry?.type) {
    parts.push(typeCell);
  } else if (typeCell && isStartRow) {
    const foldedType = foldTurkish(entry.type || "");
    const withoutType = typeCell.replace(
      /^(?:S\/B\/I|BEYANLAR?|ŞERHLER?|SERHLER?|İRTİFAKLAR?|IRTIFAKLAR?|REHINLER?|REHİNLER?|HACIZLAR?|IPOTEKLER?|İPOTEKLER?|B|S|İ|I)\s*(?:BOLUMU|BÖLÜMÜ)?\s*[:\-]?\s*/i,
      "",
    );
    if (withoutType && foldTurkish(withoutType) !== foldedType) {
      parts.push(withoutType);
    }
  }

  if (descriptionCell) {
    parts.push(descriptionCell);
  }

  return stripTakbisEncumbranceLeadingTypeNoise(cleanTakbisEncumbranceText(parts.join(" ")));
}

function isTakbisEncumbranceHeaderRow(text) {
  const folded = foldTurkish(text);
  return /TASINMAZA\s+AIT\s+SERH|MULKIYETE\s+AIT\s+SERH|SERH\s+BEYAN\s+IRTIFAK|MULKIYETE\s+AIT\s+REHIN|IPOTEK\s+BILGILERI|S\/B\/I|ACIKLAMA|MALIK\/LEHTAR|TESIS\s+KURUM|TERKIN\s+SEBEBI|^\s*\d+\s*\/\s*\d+\s*$/.test(folded);
}

function normalizeTakbisEncumbranceType(value, sectionKey = "") {
  const folded = foldTurkish(value);
  if (/IPOTEK/.test(folded) || sectionKey === "ipotek") return "İpotek";
  if (/REHIN|HACIZ/.test(folded) || sectionKey === "rehin") return "Rehin";
  if (/BEYAN|\bB\b/.test(folded)) return "Beyan";
  if (/SERH|\bS\b/.test(folded)) return "Şerh";
  if (/IRTIFAK|\bI\b/.test(folded)) return "İrtifak";
  return sectionKey === "serh" ? "" : "Takyidat";
}

function getTakbisEncumbranceStartType(value) {
  const folded = foldTurkish(cleanTakbisValue(value)).replace(/\s+/g, " ").trim();
  if (!folded) return "";
  if (/S\/B\/I|SERH\s*\/\s*BEYAN\s*\/\s*IRTIFAK/.test(folded)) {
    const trailingCode = folded.match(/\b([BSI])$/);
    if (trailingCode?.[1] === "B") return "Beyan";
    if (trailingCode?.[1] === "S") return "Şerh";
    if (trailingCode?.[1] === "I") return "İrtifak";
    const trailingType = folded.match(/\b(BEYANLAR?|SERHLER?|IRTIFAKLAR?|REHINLER?|HACIZLAR?|IPOTEKLER?)\s*(?:BOLUMU)?$/);
    if (!trailingType) return "";
    const marker = trailingType[1];
    if (/^BEYAN/.test(marker)) return "Beyan";
    if (/^SERH/.test(marker)) return "Şerh";
    if (/^IRTIFAK/.test(marker)) return "İrtifak";
    if (/^REHIN|^HACIZ/.test(marker)) return "Rehin";
    if (/^IPOTEK/.test(marker)) return "İpotek";
    return "";
  }
  if (/^(BEYAN|BEYANLAR)(?:\b|\s+BOLUMU|:|-)/.test(folded) || folded === "B") return "Beyan";
  if (/^(SERH|SERHLER)(?:\b|\s+BOLUMU|:|-)/.test(folded) || folded === "S") return "Şerh";
  if (/^(IRTIFAK|IRTIFAKLAR)(?:\b|\s+BOLUMU|:|-)/.test(folded) || folded === "I") return "İrtifak";
  if (/^(REHIN|REHINLER|HACIZ|HACIZLAR)(?:\b|\s+BOLUMU|:|-)/.test(folded)) return "Rehin";
  if (/^(IPOTEK|IPOTEKLER)(?:\b|\s+BOLUMU|:|-)/.test(folded)) return "İpotek";
  return "";
}

function extractTakbisEncumbranceDescriptionFromScope(scope, type) {
  const text = cleanTakbisEncumbranceText(
    (scope || [])
      .map((entry) => entry.cells?.description || entry.row?.text || "")
      .filter(Boolean)
      .join(" "),
  );
  if (!text) return "";
  const foldedType = foldTurkish(type);
  const leadingTypePattern = foldedType
    ? new RegExp(`^(?:${foldedType}|${foldedType}LER|${foldedType}LAR)\\s*(?:BOLUMU)?\\s*[:\\-]?\\s*`, "i")
    : null;
  return stripTakbisEncumbranceLeadingTypeNoise(leadingTypePattern ? text.replace(leadingTypePattern, "") : text)
    .replace(/\b\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}(?:\s+\d{1,2}:\d{2})?\b/g, "")
    .replace(/\b\d{3,8}\b\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTakbisEncumbranceText(value) {
  return cleanTakbisValue(value)
    .replace(/\b(?:S\/B\/I|A[CÇ]IKLAMA|ACIKLAMA|AÇIKLAMA|MALIK\/LEHTAR|MALİK\/LEHTAR|TESIS\s+KURUM|TESİS\s+KURUM|TERKIN\s+SEBEBI|TERKİN\s+SEBEBİ)\b/gi, "")
    .replace(/\s*\d+\s*\/\s*\d+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTakbisEncumbranceNoiseRecord(record) {
  const description = foldTurkish(record?.description || "").replace(/\s+/g, " ").trim();
  if (!description) return false;
  return /^(YEVMIYE\s+SEBEBI|TARIH\s*[-\s]*YEVMIYE|TESIS\s+KURUM|TERKIN\s+SEBEBI)\b/.test(description);
}

function stripTakbisEncumbranceLeadingTypeNoise(value) {
  return cleanTakbisValue(value)
    .replace(/^(?:S\/B\/I|Beyanlar?|eyanlar?|Beyan|eyan|Şerhler?|Serhler?|erhler?|Şerh|Serh|erh|İrtifaklar?|Irtifaklar?|rtifaklar?|İrtifak|Irtifak|rtifak|Rehinler?|ehinler?|Rehin|ehin|İpotekler?|Ipotekler?|potekler?|İpotek|Ipotek|potek)\s*(?:Bölümü|Bolumu)?\s*[:.\-]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTakbisEncumbranceDateInfo(value) {
  const text = cleanTakbisValue(value)
    .replace(/\b(?:Tesis\s+Kurum|Tesis|Terkin\s+Sebebi|Terkin|Tarih|Yevmiye|TARİH|YEVMİYE)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return { date: "", journalNo: "" };

  const dates = [...text.matchAll(/\b(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})(?:\s+\d{1,2}:\d{2})?\b/g)];
  const dateMatch = dates.length ? dates[dates.length - 1] : null;
  const date = dateMatch
    ? `${dateMatch[1].padStart(2, "0")}.${dateMatch[2].padStart(2, "0")}.${dateMatch[3]}`
    : "";
  const afterDate = dateMatch ? text.slice(dateMatch.index + dateMatch[0].length) : text;

  const dashJournal = afterDate.match(/[-–—]\s*([0-9]{3,8})\b/);
  let journalNo = dashJournal ? dashJournal[1] : "";
  if (!journalNo) {
    const candidates = [...afterDate.matchAll(/\b([0-9]{3,8})\b/g)]
      .map((match) => match[1])
      .filter((numberText) => !/^(19|20)\d{2}$/.test(numberText));
    journalNo = candidates.length ? candidates[candidates.length - 1] : "";
  }
  if (!journalNo && !dateMatch) {
    const candidates = [...text.matchAll(/\b([0-9]{3,8})\b/g)]
      .map((match) => match[1])
      .filter((numberText) => !/^(19|20)\d{2}$/.test(numberText));
    journalNo = candidates.length ? candidates[candidates.length - 1] : "";
  }

  return { date, journalNo };
}

function dedupeTakbisEncumbrances(records) {
  const seen = new Set();
  return (records || []).filter((record) => {
    const type = foldTurkish(record.type || "");
    const key = record.journalNo
      ? `${type}|${record.journalNo}`
      : `${type}|${foldTurkish(record.description || "")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseTakbisOwners(rows) {
  const sectionRows = getTakbisSectionRows(rows, "malik");
  const sourceRows = sectionRows.length ? sectionRows : rows;
  const rowOwners = parseTakbisOwnersFromRows(sourceRows);
  if (rowOwners.length) return rowOwners;
  return parseTakbisOwnersFromText(sourceRows.map((row) => row.text || "").join(" "));
}

function parseTakbisOwnersFromRows(rows) {
  const sourceRows = (rows || []).filter((row) => row?.text);
  const starts = sourceRows
    .map((row, index) => (/^\s*\d{8,10}\s*\(\s*SN\s*:\s*\d+\s*\)/i.test(row.text || "") ? index : -1))
    .filter((index) => index >= 0);
  if (!starts.length) return [];

  const owners = starts.map((start, index) => {
    const nextStart = starts[index + 1] ?? sourceRows.length;
    return parseTakbisOwnerRows(sourceRows.slice(start, nextStart));
  }).filter((owner) => owner.name);

  if (owners.length === 1 && !owners[0].share) owners[0].share = "1/1";
  return owners;
}

function parseTakbisOwnerRows(rows) {
  const fullText = rows.map((row) => row.text || "").join(" ");
  const baseOwner = parseTakbisOwnerSegment(fullText);
  const columnFraction = findTakbisFractionFromOwnerRows(rows);
  if (columnFraction) {
    baseOwner.share = columnFraction.value;
  }
  const rowName = buildTakbisOwnerNameFromRows(rows, baseOwner.share, baseOwner.acquisition) || baseOwner.name;
  return {
    ...baseOwner,
    name: cleanTakbisOwnerDisplayName(rowName),
  };
}

function findTakbisFractionFromOwnerRows(rows) {
  const rowList = rows || [];
  const ownerText = cleanTakbisValue(rowList.map((row) => row?.text || "").join(" "));
  for (let rowIndex = 0; rowIndex < rowList.length; rowIndex += 1) {
    const row = rowList[rowIndex];
    const items = row?.items || [];
    for (const item of items) {
      const text = cleanTakbisValue(item.str || "");
      const match = text.match(/\b(\d+)\s*\/\s*(\d+)\b/);
      if (!match) continue;
      let denominator = match[2];
      let original = match[0];
      const continuation = findWrappedDenominatorPart(rowList, rowIndex + 1, item.x, item.page);
      const textContinuation = continuation
        ? null
        : findWrappedDenominatorPartInText(ownerText.slice(ownerText.indexOf(match[0]) + match[0].length), match[1], denominator);
      if (continuation) {
        denominator += continuation.text;
        original += ` ${continuation.text}`;
      } else if (textContinuation) {
        denominator += textContinuation;
        original += ` ${textContinuation}`;
      }
      return { original, value: `${match[1]}/${denominator}` };
    }
  }
  return null;
}

function findWrappedDenominatorPart(rows, startIndex, fractionX, page) {
  for (let index = startIndex; index < Math.min(rows.length, startIndex + 3); index += 1) {
    const row = rows[index];
    if (!row || row.page !== page || /^\s*\d{8,10}\s*\(\s*SN\s*:\s*\d+\s*\)/i.test(row.text || "")) return null;
    if (/^\s*\d+\s*\/\s*\d+\s*$/.test(row.text || "")) continue;
    const candidate = (row.items || []).find((item) => {
      const text = cleanTakbisValue(item.str || "");
      return /^\d{1,2}$/.test(text) && Math.abs(Number(item.x) - Number(fractionX)) <= 18;
    });
    if (candidate) return { text: cleanTakbisValue(candidate.str || "") };
    if (/\b\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}\b/.test(row.text || "")) return null;
  }
  return null;
}

function findWrappedDenominatorPartInText(afterFraction, numerator, denominator) {
  if (!/^\d{3,4}$/.test(String(denominator || ""))) return "";
  const scanText = cleanTakbisValue(afterFraction)
    .replace(/\b\d+\s*\/\s*\d+\b/g, " ")
    .split(/\b\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}\b/)[0]
    .slice(0, 180);
  const candidates = [...scanText.matchAll(/(^|[\s:;,-])(\d{1,2})(?=$|[\s:;,-])/g)]
    .map((match) => match[2])
    .filter((value) => value !== String(numerator || ""));
  return candidates[0] || "";
}

function buildTakbisOwnerNameFromRows(rows, shareValue = "", acquisitionText = "") {
  const nameParts = [];
  const sharePattern = shareValue ? new RegExp(`\\b${escapeRegExp(shareValue).replace("/", "\\s*\\/\\s*")}\\b`) : null;

  for (const [index, row] of rows.entries()) {
    let text = cleanTakbisValue(row.text || "");
    if (!text || /^\d+\s*\/\s*\d+$/.test(text)) continue;
    if (index === 0) {
      text = text.replace(/^\s*\d{8,10}\s*\(\s*SN\s*:\s*\d+\s*\)\s*/i, "");
    }
    let hasRelationBreak = /\s*:\s*/.test(text);
    if (sharePattern && sharePattern.test(text)) {
      text = text.split(sharePattern)[0] || "";
    } else {
      text = text.replace(/\b\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}\b.*$/g, "");
      text = text.replace(/\s+\d{3,}\s*$/g, "");
    }
    if (hasRelationBreak) {
      text = text.split(/\s*:\s*/)[0] || "";
    }
    text = cleanTakbisOwnerNameFragment(text, acquisitionText);
    if (text) nameParts.push(text);
    if (hasRelationBreak) break;
  }

  return toTitleCaseTr(nameParts.join(" ").replace(/\s+/g, " ").trim());
}

function cleanTakbisOwnerNameFragment(value, acquisitionText = "") {
  const [beforeRelation] = cleanTakbisValue(value).split(/\s*:\s*/);
  let text = cleanTakbisValue(beforeRelation)
    .replace(/\b(?:Tüzel|Tuzel)?\s*Kişiliklerin\s+(?:Ünvan|Unvan)\s+Değiş(?:imi|ikliği)\b/gi, " ")
    .replace(/\b[VT]\s+Kişiliklerin\s+(?:Ünvan|Unvan)\s+Değiş(?:imi|ikliği)\b/gi, " ")
    .replace(/\bV\s*\.?\s*\d+\s*İmar\b.*$/gi, " ")
    .replace(/\b\d+\s*İmar\b/gi, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\b(?:Hissesine|Düşen|Dusen|Arsa|Payı|Payi|Metrekare|M2|m²)\b/gi, " ")
    .replace(/\b\d+\s*\/\s*\d+(?:\s+\d{1,3})?\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\s+\d{3,}\s*$/g, " ");
  if (acquisitionText) {
    text = text.replace(new RegExp(escapeRegExp(acquisitionText), "ig"), " ");
  }
  return removeTakbisAcquisitionTokens(text)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+(?:Oğlu|Oglu|Kızı|Kizi)\b.*$/iu, " ")
    .replace(/\b[VT]\b/gi, " ")
    .replace(/\s*[-–—]\s*/g, " ")
    .replace(/\s+\d{3,}\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTakbisOwnersFromText(text) {
  const compact = cleanTakbisValue(text);
  if (!compact) return [];

  const starts = [...compact.matchAll(/\b\d{8,10}\s*\(\s*SN\s*:\s*\d+\s*\)/gi)].map((match) => match.index);
  if (!starts.length) return [];

  const owners = starts.map((start, index) => {
    const nextStart = starts[index + 1] ?? compact.length;
    return parseTakbisOwnerSegment(compact.slice(start, nextStart));
  }).filter((owner) => owner.name);

  if (owners.length === 1 && !owners[0].share) owners[0].share = "1/1";
  return owners;
}

function parseTakbisOwnerSegment(segment) {
  const text = cleanTakbisValue(segment);
  const withoutSystem = text.replace(/^\s*\d{8,10}\s*\(\s*SN\s*:\s*\d+\s*\)\s*/i, "");
  const fraction = findTakbisFraction(withoutSystem);
  const fractionIndex = fraction ? withoutSystem.indexOf(fraction.original) : -1;
  const tail = fractionIndex >= 0 ? withoutSystem.slice(fractionIndex + fraction.original.length) : withoutSystem;
  const dateMatch = tail.match(/\b(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})\b/);
  const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}` : "";
  const afterDate = dateMatch ? tail.slice(dateMatch.index + dateMatch[0].length) : "";
  const journalMatch = afterDate.match(/\b([0-9]{3,})\b/);
  const edinme = extractTakbisAcquisitionReason(withoutSystem, tail.slice(0, dateMatch ? dateMatch.index : tail.length));
  const name = cleanTakbisOwnerName(withoutSystem, fraction?.original, edinme);

  return {
    name,
    share: fraction ? fraction.value : "",
    acquisition: edinme,
    date,
    journalNo: journalMatch ? journalMatch[1] : "",
  };
}

function findTakbisFraction(text) {
  const normalized = cleanTakbisValue(text);
  const direct = normalized.match(/\b(\d+)\s*\/\s*(\d+)\b/);
  if (direct) {
    const afterFraction = normalized.slice(direct.index + direct[0].length);
    const suffix = afterFraction.match(/^\s+(\d{1,2})\b/);
    const textContinuation = suffix ? "" : findWrappedDenominatorPartInText(afterFraction, direct[1], direct[2]);
    const shouldJoinWrappedDenominator =
      suffix &&
      direct[2].length >= 3 &&
      direct[2].length <= 4 &&
      suffix[1] !== direct[1];
    const continuation = shouldJoinWrappedDenominator ? suffix[1] : textContinuation;
    const denominator = continuation ? `${direct[2]}${continuation}` : direct[2];
    return {
      original: direct[0] + (continuation ? ` ${continuation}` : ""),
      value: `${direct[1]}/${denominator}`,
    };
  }
  return null;
}

function cleanTakbisOwnerName(value, fractionText = "", acquisitionText = "") {
  const [beforeFather] = String(value || "").split(/\s*:\s*/);
  let cleaned = cleanTakbisValue(beforeFather)
    .replace(/\(\s*SN\s*:\s*\d+\s*\)/gi, "")
    .replace(/\bSN\s*:\s*\d+\b/gi, "")
    .replace(/\b\d{8,10}\b/g, "")
    .replace(/\b(?:Tüzel|Tuzel)?\s*Kişiliklerin\s+(?:Ünvan|Unvan)\s+Değiş(?:imi|ikliği)\b/gi, " ")
    .replace(/\b[VT]\s+Kişiliklerin\s+(?:Ünvan|Unvan)\s+Değiş(?:imi|ikliği)\b/gi, " ")
    .replace(/\bV\s*\.?\s*\d+\s*İmar\b.*$/gi, " ")
    .replace(/\b\d+\s*İmar\b/gi, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\b(?:Hissesine|Düşen|Dusen|Arsa|Payı|Payi|Metrekare|M2|m²)\b/gi, " ")
    .replace(/\b\d+\s*\/\s*\d+(?:\s+\d{1,3})?\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\b\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}\b.*$/g, " ");
  if (fractionText) {
    cleaned = cleaned.replace(fractionText, " ");
  }
  if (acquisitionText) {
    cleaned = cleaned.replace(new RegExp(escapeRegExp(acquisitionText), "ig"), " ");
  }
  return cleanTakbisOwnerDisplayName(removeTakbisAcquisitionTokens(cleaned)
    .replace(/\b(?:Satış|Satis|İntikal|Intikal|Bağış|Bagis|Bağis|Taksim|Trampa|Kadastro|İfraz|Ifraz|Tevhid)\b/gi, " ")
    .trim());
}

function cleanTakbisOwnerDisplayName(value) {
  const [beforeRelation] = cleanTakbisValue(value).split(/\s*:\s*/);
  const cleaned = cleanTakbisValue(beforeRelation)
    .replace(/\b(?:Tüzel|Tuzel)?\s*Kişiliklerin\s+(?:Ünvan|Unvan)\s+Değiş(?:imi|ikliği)\b/gi, " ")
    .replace(/\b[VT]\s+Kişiliklerin\s+(?:Ünvan|Unvan)\s+Değiş(?:imi|ikliği)\b/gi, " ")
    .replace(/\bV\s*\.?\s*\d+\s*İmar\b.*$/gi, " ")
    .replace(/\b\d+\s*İmar\b/gi, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+(?:Oğlu|Oglu|Kızı|Kizi)\b.*$/iu, " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\b[VT]\b/gi, " ")
    .replace(/\s*[-–—]\s*/g, " ")
    .replace(/\s+\d{3,}\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return toTitleCaseTr(removeTakbisParentTail(cleaned));
}

function removeTakbisParentTail(value) {
  const words = cleanTakbisValue(value).split(/\s+/).filter(Boolean);
  if (words.length < 2) return cleanTakbisValue(value);
  const last = foldTurkish(words[words.length - 1]).replace(/[^A-Z]/g, "");
  if (!["OGLU", "KIZI"].includes(last)) return cleanTakbisValue(value);
  return words.length >= 4 ? words.slice(0, -2).join(" ") : words.slice(0, -1).join(" ");
}

function cleanTakbisAcquisition(value) {
  return cleanTakbisValue(value)
    .replace(/^[-–—\s]+/, "")
    .replace(/[-–—\s]+$/, "")
    .replace(/\s+-\s+/g, " ")
    .trim();
}

function extractTakbisAcquisitionReason(segment, fallback) {
  const source = cleanTakbisValue(segment);
  const reason = findTakbisAcquisitionToken(source);
  if (reason) return reason;
  const fallbackText = cleanTakbisAcquisition(String(fallback || "").replace(/:\s*.*$/g, ""));
  const folded = foldTurkish(fallbackText);
  if (/\d+[.,]\d+|HISSESINE|DUSEN|ARSA|PAY|METREKARE|M2|TUZEL|GERCEK|KISI/.test(folded)) return "";
  return fallbackText;
}

function findTakbisAcquisitionToken(value) {
  const aliases = [
    ["SATIS", "Satış"],
    ["INTIKAL", "İntikal"],
    ["BAGIS", "Bağış"],
    ["TAKSIM", "Taksim"],
    ["TRAMPA", "Trampa"],
    ["KADASTRO", "Kadastro"],
    ["IFRAZ", "İfraz"],
    ["TEVHID", "Tevhid"],
  ];
  const tokens = cleanTakbisValue(value).split(/\s+/);
  for (const token of tokens) {
    const folded = foldTurkish(token).replace(/[^A-Z0-9]/g, "");
    const found = aliases.find(([alias]) => folded === alias);
    if (found) return found[1];
  }
  const foldedText = foldTurkish(value).replace(/\s+/g, " ");
  if (/\bKAT\s+IRTIFAKI?\b/.test(foldedText) && /\bTESIS(?:I)?\b/.test(foldedText)) return "Kat İrtifakı Tesisi";
  if (/\bIMAR\b/.test(foldedText)) return "İmar";
  if (/\b(?:TUZEL\s+)?KISILIKLERIN\s+UNVAN\s+DEGIS(?:IMI|IKLIGI)\b/.test(foldedText) || /\b[VT]\s+KISILIKLERIN\s+UNVAN\s+DEGIS(?:IMI|IKLIGI)\b/.test(foldedText)) return "Tüzel Kişiliklerin Ünvan Değişikliği";
  if (/\bKAT\s+IRTIFAKI\b/.test(foldedText)) return "Kat İrtifakı";
  if (/\bKAT\s+MULKIYETI\b/.test(foldedText)) return "Kat Mülkiyeti";
  if (/\bCINS\s+TASHIHI\b/.test(foldedText)) return "Cins Tashihi";
  if (/\bMAHKEME\s+KARARI\b/.test(foldedText)) return "Mahkeme Kararı";
  return "";
}

function removeTakbisAcquisitionTokens(value) {
  const acquisitionAliases = new Set(["SATIS", "INTIKAL", "BAGIS", "TAKSIM", "TRAMPA", "KADASTRO", "IFRAZ", "TEVHID", "KAT", "IRTIFAK", "IRTIFAKI", "TESIS", "TESISI", "MULKIYETI"]);
  return cleanTakbisValue(value)
    .split(/\s+/)
    .filter((token) => !acquisitionAliases.has(foldTurkish(token).replace(/[^A-Z0-9]/g, "")))
    .join(" ");
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOwnerShareWarning(owners) {
  if (!owners?.length) return "";
  if (owners.some((owner) => !owner.share)) return "Bazı malik hisse payları okunamadı; toplam hisse 1/1 kontrol edilemedi.";
  const total = sumOwnerFractionsBigInt(owners.map((owner) => owner.share).filter(Boolean));
  if (!total) return "Malik hisse payları okunamadı; toplam hisse 1/1 kontrol edilemedi.";
  return total.numerator === total.denominator
    ? ""
    : `Malik hisse toplamı ${total.numerator}/${total.denominator}; 1/1 değil. Kontrol edin.`;
}

function sumOwnerFractionsBigInt(fractions) {
  if (!fractions.length) return null;
  let numerator = 0n;
  let denominator = 1n;
  let validCount = 0;
  fractions.forEach((fraction) => {
    const match = String(fraction || "").match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!match) return;
    const partNumerator = BigInt(match[1]);
    const partDenominator = BigInt(match[2]);
    if (partNumerator === 0n || partDenominator === 0n) return;
    numerator = numerator * partDenominator + partNumerator * denominator;
    denominator *= partDenominator;
    const divisor = gcdBigInt(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;
    validCount += 1;
  });
  return validCount ? { numerator, denominator, validCount } : null;
}

function formatOwnerShareSummary(rows) {
  const fractions = (rows || []).map((row) => cleanTakbisValue(row?.c1 || "")).filter(Boolean);
  const total = sumOwnerFractionsBigInt(fractions);
  if (!fractions.length || !total || total.validCount !== fractions.length) {
    return {
      ok: false,
      text: "Toplam hisse: okunamayan veya hatalı hisse var. Kontrol edin.",
    };
  }
  const percent = Number(total.numerator * 10000n / total.denominator) / 100;
  const percentText = Number.isFinite(percent) ? `%${percent.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}` : "%-";
  const fractionText = `${total.numerator}/${total.denominator}`;
  const ok = total.numerator === total.denominator;
  return {
    ok,
    text: ok
      ? `Toplam hisse: ${fractionText} (${percentText})`
      : `Toplam hisse: ${fractionText} (${percentText}); 1/1 değil. Kontrol edin.`,
  };
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function gcdBigInt(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1n;
}

function cleanTakbisQuality(value) {
  return cleanTakbisValue(value)
    .replace(/\s*Bağımsız\s+Bölüm\s+Brüt.*$/i, "")
    .replace(/\s*Bağımsız\s+Bölüm\s+Net.*$/i, "")
    .replace(/\s*BB\s+Brüt.*$/i, "")
    .replace(/\s*BB\s+Net.*$/i, "")
    .replace(/\s*Blok\s*\/\s*Kat.*$/i, "")
    .trim();
}

function cleanTakbisValue(value) {
  return normalizeSlash(value).replace(/\s+/g, " ").replace(/^[-–—]\s*$/, "").trim();
}

function normalizeSlash(value) {
  return String(value || "").replace(/[⁄∕]/g, "/");
}

function splitFirst(value, separator) {
  const text = normalizeSlash(value);
  const index = text.indexOf(separator);
  return index >= 0 ? [text.slice(0, index).trim(), text.slice(index + 1).trim()] : [text.trim(), ""];
}

async function readCoordinatePdfText(file, pageLimit = 3) {
  if (window.pdfReady) {
    await window.pdfReady;
  }
  const pdfjs = window.pdfjsLib || globalThis.pdfjsLib;
  if (!pdfjs?.getDocument) {
    throw new Error("PDF okuma kütüphanesi yüklenemedi.");
  }

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.local.js", window.location.href).href;
  }

  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(pdfjs, buffer);
  const pages = [];

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, pageLimit); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const pageHeight = viewport.height;
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const items = content.items
      .filter((item) => item.str && item.str.trim())
      .map((item) => {
        const [, b, c, , x, y] = item.transform;
        return { text: item.str.trim(), x, y: pageHeight - y, rotated: Math.abs(b) > 0.3 || Math.abs(c) > 0.3 };
      })
      .filter((item) => !item.rotated)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const rows = [];
    const tolerance = 4;
    items.forEach((item) => {
      const last = rows[rows.length - 1];
      if (last && Math.abs(item.y - last.y) <= tolerance) {
        last.items.push(item);
      } else {
        rows.push({ y: item.y, items: [item] });
      }
    });

    pages.push(rows
      .map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" "))
      .join("\n"));
  }

  return pages.join("\n");
}

async function readTakbisOcrText(file, pageLimit = 1) {
  if (!window.Tesseract?.recognize) return "";
  if (window.pdfReady) {
    await window.pdfReady;
  }
  const pdfjs = window.pdfjsLib || globalThis.pdfjsLib;
  if (!pdfjs?.getDocument) return "";

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.local.js", window.location.href).href;
  }

  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(pdfjs, buffer);
  const texts = [];

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, pageLimit); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.6 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const result = await Tesseract.recognize(canvas, "tur+eng", {
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÇĞİÖŞÜçğıöşü/:.,;-() ",
    });
    texts.push(result?.data?.text || "");
  }

  return texts.join("\n");
}

async function readPdfText(file) {
  if (shouldUsePdfTextOnlyMode()) {
    return readPdfTextOnServer(file);
  }

  if (window.pdfReady) {
    await window.pdfReady;
  }
  const pdfjs = window.pdfjsLib || globalThis.pdfjsLib;
  if (!pdfjs?.getDocument) {
    throw new Error("PDF okuma kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin veya ekran alıntısı yükleyin.");
  }

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.local.js", window.location.href).href;
  }

  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(pdfjs, buffer);
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  const text = pages.join("\n");
  if (text.trim()) return text;

  if (shouldUsePdfTextOnlyMode()) throw getIosPdfTextOnlyError();
  return recognizePdfPages(pdf);
}

async function readPdfTextOnServer(file) {
  const response = await fetch("/api/pdf-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "X-File-Name": encodeURIComponent(file.name || "belge.pdf"),
    },
    body: file,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "PDF metni sunucu tarafında okunamadı.");
  }

  const text = String(payload.text || "");
  if (text.trim()) return text;
  throw getIosPdfTextOnlyError();
}

async function recognizePdfPages(pdf) {
  if (!window.Tesseract?.recognize) {
    throw new Error("PDF metin katmanı boş. OCR kütüphanesi yüklenemediği için görsel PDF okunamadı.");
  }

  const texts = [];
  const pageLimit = Math.min(pdf.numPages, 2);

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const result = await Tesseract.recognize(canvas, "tur+eng");
    texts.push(result?.data?.text || "");
  }

  return texts.join("\n");
}

async function recognizeImageText(file) {
  if (!window.Tesseract?.recognize) {
    throw new Error("OCR kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.");
  }

  const result = await Tesseract.recognize(file, "tur+eng");
  return result?.data?.text || "";
}

function parseEkbFields(text) {
  const raw = String(text || "");
  const lines = raw.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const normalizedText = lines.join("\n");
  const belgeNo = extractEkbDocumentNo(normalizedText);
  const dates = extractEkbDates(lines);
  const classes = extractEkbClasses(lines, normalizedText);

  return {
    ekbDocumentNo: belgeNo,
    ekbIssueDate: dateTrToIso(dates.issueDate),
    ekbValidUntil: dateTrToIso(dates.validUntil),
    ekbEnergyClass: classes.energyClass,
    ekbEmissionClass: classes.emissionClass,
  };
}

function parseImarFields(text) {
  const raw = String(text || "");
  const allLines = raw.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const lines = extractImarPlanInfoLines(allLines);
  const joined = lines.join("\n");
  const flat = lines.join(" ");
  const nextFieldPattern = /(Plan\s+Ad[ıi]|Plan\s+Fonksiyon|Tasdik|Onay|T\.?A\.?K\.?S|K\.?A\.?K\.?S|Emsal|Bah[çc]e|Nizam|Kat\s+Adedi|Bina\s+Y[üu]ksekli[ğg]i|Yola\s+Terk)/i;
  const planSpecialNote = extractImarPrePlanBlock(allLines, ["PLAN OZEL NOTU", "PLAN OZEL NOT"]);
  const restrictionNote = extractImarPrePlanBlock(allLines, ["KISITLAMA ACIKLAMA", "KISITLAMA ACIKL"]);
  const planRestrictionNote = buildImarPlanRestrictionNote(planSpecialNote, restrictionNote);
  const bilgiAlinanKurum = extractImarInfoInstitution(allLines);

  const pick = (...patterns) => {
    for (const pattern of patterns) {
      const match = flat.match(pattern);
      if (match?.[1]) return cleanImarToken(match[1]);
    }
    return "";
  };

  const collectAfterLabel = (labelPattern) => {
    const start = lines.findIndex((line) => labelPattern.test(line));
    if (start < 0) return "";
    const first = lines[start].replace(labelPattern, "").replace(/^[:\-]\s*/, "").trim();
    const parts = [];
    if (first) parts.push(first);
    for (let i = start + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (nextFieldPattern.test(line)) break;
      if (/^(not|uyar[ıi]|a[çc][ıi]klama|otopark)\b/i.test(line)) break;
      if (line.length > 120) break;
      parts.push(line);
      if (parts.join(" ").length > 160) break;
    }
    return cleanImarToken(parts.join(" "));
  };

  const findLine = (pattern) => lines.find((line) => pattern.test(line)) || "";
  const findLineByFold = (...needles) => {
    return lines.find((line) => {
      const folded = foldTurkish(line);
      return needles.some((needle) => folded.includes(needle));
    }) || "";
  };
  const valueFromKnownLine = (line, pattern) => {
    if (!line) return "";
    return cleanImarToken(line.replace(pattern, "").replace(/^[:\-]\s*/, ""));
  };
  const valueFromLine = (pattern) => {
    const line = findLine(pattern);
    if (!line) return "";
    return cleanImarToken(line.replace(pattern, "").replace(/^[:\-]\s*/, ""));
  };

  const scaleLineRaw = findLineByFold("OLCEGI");
  const tasdikLine = findLineByFold("TASDIK TARIHI");
  const planNameRaw = findLineByFold("PLANI ADI", "PLAN ADI");
  const scaleLine = valueFromKnownLine(scaleLineRaw, /^[^\d]*(?=\d)/i);
  const planNameLine = valueFromKnownLine(planNameRaw, /^Plan[ıiİI]\s+Ad[ıiİI]\s*/i);
  const heightLine = findLineByFold("BINA YUKSEKLIGI");
  const frontLine = findLineByFold("ON BAHCE");
  const sideLine = findLineByFold("YAN BAHCE");
  const backLine = findLineByFold("ARKA BAHCE");

  const frontNizamMatch = frontLine.match(/[ÖO]n\s+Bah[çc]e\s+(.+?)\s+[İI]n[şs]aat\s+Nizam[ıi]\s+(.+)$/i);
  const sideTaksMatch = sideLine.match(/Yan\s+Bah[çc]e\s+(.+?)\s+T\.?\s*A\.?\s*K\.?\s*S\.?\s+([0-9]+(?:[.,][0-9]+)?|-)/i);
  const backKaksMatch = backLine.match(/Arka\s+Bah[çc]e\s+(.+?)\s+K\.?\s*A\.?\s*K\.?\s*S\.?\s*(?:\(\s*Emsal\s*\))?\s+([0-9]+(?:[.,][0-9]+)?|-)/i);
  const heightValuePattern = "(?:[0-9]+(?:[.,][0-9]+)?\\s*m?|serbest|-)";
  const heightKatMatch = heightLine.match(new RegExp(`Bina\\s+Y[üu]ksekli[ğg]i\\s+(${heightValuePattern})\\s+Kat\\s+Adedi\\s+(\\d+)`, "i"));

  let planAdi = cleanImarPlanName(planNameLine) || pick(
    /Plan[ıi]\s+Ad[ıi]\s*:?\s*([^\n]+?)(?=\s+(?:Plan\s+Fonksiyon|Tasdik|Onay|T\.?A\.?K\.?S|K\.?A\.?K\.?S)|$)/i,
    /Mer['’]?[ıi]\s+[İi]mar\s+Plan[ıi]\s*:?\s*([^\n]+)/i
  );
  const scaleFromName = planAdi.match(/(\d+\s*\/\s*\d+)/);
  let planOlcegi = cleanImarToken(scaleLine.match(/(\d+\s*\/\s*\d+)/)?.[1] || (scaleFromName || flat.match(/[ÖöOo]l[çc][eğg]?[iı]\s*:?\s*(\d+\s*\/\s*\d+)/i) || [])[1] || "");
  planAdi = cleanImarPlanName(planAdi);

  const planTarihi = normalizeImarDate(tasdikLine || pick(
    /(?:Plan\s+)?(?:Tasdik|Onay)\s+Tarih(?:i)?(?:\s+ve\s+No)?\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i,
    /Tasdik\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i
  ));

  const legendFromPlanBlock = extractImarLegendFromLines(lines);
  const legendFromFullText = extractImarLegendFromLines(allLines);
  let planFonk = legendFromPlanBlock || legendFromFullText || detectImarFunctionFromText(planAdi) || normalizeImarPlanFunction(collectAfterLabel(/Plan\s+Fonksiyon(?:u)?\s*:?\s*/i) || pick(
    /Plan\s+Fonksiyon(?:u)?\s*:?\s*([^\n]+?)(?=\s+(?:T\.?A\.?K\.?S|K\.?A\.?K\.?S|Emsal|Nizam|Bah[çc]e)|$)/i
  ));

  const taks = normalizeDecimalToken(sideTaksMatch?.[2] || pick(
    /T\.?\s*A\.?\s*K\.?\s*S\.?\s*:?\s*([0-9]+(?:[.,][0-9]+)?|-)/i,
    /Taban\s+Alan[ıi]\s+Katsay[ıi]s[ıi]\s*:?\s*([0-9]+(?:[.,][0-9]+)?|-)/i
  ));
  const kaks = normalizeDecimalToken(backKaksMatch?.[2] || pick(
    /K\.?\s*A\.?\s*K\.?\s*S\.?\s*(?:\(\s*Emsal\s*\))?\s*:?\s*([0-9]+(?:[.,][0-9]+)?|-)/i,
    /Emsal\s*:?\s*([0-9]+(?:[.,][0-9]+)?|-)/i,
    /\bE\s*=\s*([0-9]+(?:[.,][0-9]+)?)/i
  ));

  const onBahce = normalizeImarSetbackToken(frontNizamMatch?.[1] || pick(/[ÖO]n\s+Bah[çc]e(?:\s+Mesafesi)?\s*:?\s*([0-9]+(?:[.,][0-9]+)?\s*m?|-)/i));
  const yanBahce = normalizeImarSetbackToken(sideTaksMatch?.[1] || pick(/Yan\s+Bah[çc]e(?:\s+Mesafesi)?\s*:?\s*([0-9]+(?:[.,][0-9]+)?\s*m?|-)/i));
  const arkaBahce = normalizeImarSetbackToken(backKaksMatch?.[1] || pick(/Arka\s+Bah[çc]e(?:\s+Mesafesi)?\s*:?\s*([0-9]+(?:[.,][0-9]+)?\s*m?|-)/i));
  let insaatNizami = imarNizamCodeToLabel(frontNizamMatch?.[2] || pick(
    /(?:[İI]n[şs]aat|Yap[ıi])\s+Nizam[ıi]\s*:?\s*([A-ZÇĞİÖŞÜ]{1,3}|[A-Za-zÇĞİÖŞÜçğıöşü\s]+?)(?=\s+(?:Kat|Bina|T\.?A\.?K\.?S|K\.?A\.?K\.?S|Bah[çc]e)|$)/i,
    /\bNizam[ıi]\s*:?\s*([A-ZÇĞİÖŞÜ]{1,3}|[A-Za-zÇĞİÖŞÜçğıöşü\s]+?)(?=\s+(?:Kat|Bina|T\.?A\.?K\.?S|K\.?A\.?K\.?S|Bah[çc]e)|$)/i
  ));

  let katAdedi = heightKatMatch?.[2] || pick(/Kat\s+Adedi\s*:?\s*(\d+)/i);
  let binaYuksekligi = normalizeMeterToken(heightKatMatch?.[1] || pick(
    new RegExp(`Bina\\s+Y[üu]ksekli[ğg]i\\s*:?\\s*(${heightValuePattern})`, "i"),
    new RegExp(`H\\s*max\\s*:?\\s*(${heightValuePattern})`, "i")
  ));
  const nizamFallback = detectImarNizamFromText(joined);
  if (!insaatNizami && nizamFallback.insaatNizami) {
    insaatNizami = nizamFallback.insaatNizami;
  }
  if (!katAdedi && nizamFallback.katAdedi) {
    katAdedi = nizamFallback.katAdedi;
  }
  if (!planFonk) {
    planFonk = detectImarFunctionFromText(joined);
  }
  if (kaks) {
    insaatNizami = "Ayrık";
  }
  const calculatedKatAdedi = calculateImarKatFromHeight(binaYuksekligi);
  if (calculatedKatAdedi) {
    katAdedi = calculatedKatAdedi;
  }
  if (!binaYuksekligi && katAdedi) {
    binaYuksekligi = `${(Number(katAdedi) * 3 + 0.5).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
  }

  return {
    bilgiAlinanKurum,
    planOlcegi,
    planAdi,
    planTarihi,
    planFonk,
    taks,
    kaks,
    onBahce,
    yanBahce,
    arkaBahce,
    insaatNizami,
    binaYuksekligi,
    katAdedi,
    yolaTerk: "",
    planSpecialNote,
    restrictionNote,
    planRestrictionNote,
    imarNeighborhood: cleanImarToken(valueFromLine(/^İdari\s+Mahalle\s+Ad[ıi]\s*/i)),
    imarStreet: formatImarAddressStreet(valueFromLine(/^Cadde\s*\/\s*Sokak\s*/i)),
    imarOuterDoor: cleanImarToken(valueFromLine(/^Kap[ıi]\s+No\s*/i)),
  };
}

function cleanImarToken(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[;,\s]+$/g, "")
    .trim();
}

function extractImarInfoInstitution(lines) {
  const source = Array.isArray(lines) ? lines : [];
  for (const line of source.slice(0, 30)) {
    const afterDateTime = line.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{4}(?:\s+(?:Saat|Saati)\s*:?)?\s+\d{1,2}:\d{2}\s+(.+)$/i);
    if (!afterDateTime) continue;
    const institution = cleanImarInstitutionName(afterDateTime[1]);
    if (institution) return institution;
  }

  const fullText = source.slice(0, 30).join(" ");
  const afterLabel = fullText.match(/Bilgi\s+Al[ıi]n(?:ma|an)\s+(?:Tarih(?:i)?|Zaman[ıi])[^0-9]{0,80}\d{1,2}[./-]\d{1,2}[./-]\d{4}(?:\s+(?:Saat|Saati)\s*:?)?(?:\s+\d{1,2}:\d{2})?\s+(.+?Belediyesi)\b/i);
  if (afterLabel) return cleanImarInstitutionName(afterLabel[1]);

  return "";
}

function cleanImarInstitutionName(value) {
  let text = cleanImarToken(value)
    .replace(/^(?:T\.?\s*C\.?|TC)\s+/i, "")
    .replace(/\bE\s*[- ]?\s*İmar\b.*$/i, "")
    .replace(/\bE\s*[- ]?\s*Imar\b.*$/i, "")
    .replace(/\bİmar\s+ve\s+Şehircilik\b.*$/i, "")
    .replace(/\bImar\s+ve\s+Sehircilik\b.*$/i, "");
  const municipalityMatch = text.match(/(.+?\bBelediyesi)\b/i);
  if (municipalityMatch) text = municipalityMatch[1];
  text = text.replace(/^(?:T\.?\s*C\.?|TC)\s+/i, "").trim();
  return text ? toTitleCaseTr(text) : "";
}

function extractImarPlanInfoLines(lines) {
  const source = Array.isArray(lines) ? lines : [];
  const start = source.findIndex((line) => {
    const folded = foldTurkish(line);
    return folded.includes("YURURLUKTEKI IMAR PLANI") && folded.includes("YAPILASMA BILGILERI");
  });
  if (start < 0) return source;

  const end = source.findIndex((line, index) => {
    if (index <= start) return false;
    const folded = foldTurkish(line);
    return folded.includes("KADASTRO PARSEL ADRESI")
      || folded.includes("TAPU KUTUGU")
      || folded.includes("ACIKLAMALAR")
      || folded.includes("NOTLAR");
  });

  const block = source.slice(start + 1, end > start ? end : undefined);
  return block.length ? block : source;
}

function extractImarPrePlanBlock(lines, labelNeedles) {
  const source = Array.isArray(lines) ? lines : [];
  const start = source.findIndex((line) => {
    const folded = foldTurkish(line);
    return labelNeedles.some((needle) => folded.includes(needle));
  });
  if (start < 0) return "";

  const parts = [];
  const startLine = cleanImarToken(source[start]);
  const sameLineValue = cleanImarPrePlanLabelValue(startLine, labelNeedles);
  if (sameLineValue && sameLineValue !== "-") parts.push(sameLineValue);
  if (hasAnotherImarPrePlanBoundaryAfterLabel(startLine, labelNeedles)) {
    return cleanImarToken(parts.join(" "));
  }

  for (let index = start + 1; index < source.length; index += 1) {
    const line = cleanImarToken(source[index]);
    if (!line) continue;
    if (isImarPrePlanSectionBoundary(line)) break;
    if (line === "-") continue;
    parts.push(line);
  }

  return cleanImarToken(parts.join(" "));
}

function cleanImarPrePlanLabelValue(line, labelNeedles) {
  const clean = cleanImarToken(line);
  if (!clean) return "";
  const folded = foldTurkish(clean);
  const label = labelNeedles.find((needle) => folded.includes(needle));
  if (!label) return "";
  const labelEnd = folded.indexOf(label) + label.length;
  const afterLabel = trimImarPrePlanAtNextBoundary(clean.slice(Math.min(clean.length, labelEnd)).replace(/^[:\-]\s*/, "").trim());
  if (!afterLabel || afterLabel === "-") return "";
  if (afterLabel.startsWith("-")) return cleanImarToken(afterLabel.slice(1));
  return afterLabel;
}

function buildImarPlanRestrictionNote(planSpecialNote, restrictionNote) {
  const parts = [];
  if (planSpecialNote) parts.push(planSpecialNote);
  if (restrictionNote) parts.push(restrictionNote);
  return cleanImarPlanRestrictionNote(parts.join("\n"));
}

function cleanImarPlanRestrictionNote(value) {
  return String(value || "")
    .split(/\n+/)
    .filter((line) => !isImarPlanRestrictionExcludedLine(line))
    .map((line) => trimImarPrePlanAtNextBoundary(line))
    .filter((line) => line && !isImarPrePlanSectionBoundary(line))
    .join("\n")
    .trim();
}

function isImarPlanRestrictionExcludedLine(value) {
  const folded = foldTurkish(value).replace(/[^A-Z0-9]+/g, " ").trim();
  return /^(ZEMIN\s+DURUMU|HAVA\s+MANIA|PARSELASYON)\b/.test(folded)
    || /\bPARSELASYON\b/.test(folded)
    || /\bENCUMEN\s+TASDIKLI\b/.test(folded);
}

function hasAnotherImarPrePlanBoundaryAfterLabel(line, labelNeedles) {
  const clean = cleanImarToken(line);
  if (!clean) return false;
  const folded = foldTurkish(clean).replace(/[^A-Z0-9]+/g, " ").trim();
  const label = labelNeedles.find((needle) => folded.includes(needle));
  if (!label) return false;
  const afterLabel = folded.slice(folded.indexOf(label) + label.length);
  return isImarPrePlanSectionBoundary(afterLabel);
}

function isImarPrePlanSectionBoundary(value) {
  const folded = foldTurkish(value).replace(/[^A-Z0-9]+/g, " ").trim();
  return /\bPLAN\s+FONKSIYON/.test(folded)
    || /\bPLAN\s+OZEL\s+NOTU/.test(folded)
    || /\bKISITLAMA\s+ACIKL/.test(folded)
    || /\bYAPI\s+ADASI\s+NOTU/.test(folded)
    || /\bZEMIN\s+DURUMU/.test(folded)
    || /\bHAVA\s+MANIA/.test(folded)
    || /\bPARSELASYON/.test(folded)
    || /\bKADASTRO\s+PARSEL/.test(folded)
    || /\bYURURLUKTEKI\s+IMAR\s+PLANI/.test(folded);
}

function trimImarPrePlanAtNextBoundary(value) {
  const text = cleanImarToken(value);
  if (!text) return "";
  const boundaryPatterns = [
    /Plan\s+Fonksiyon(?:u)?/i,
    /Plan\s+[ÖO]zel\s+Notu/i,
    /K[ıi]s[ıi]tlama\s+A[çc][ıi]klama/i,
    /Yap[ıi]\s+Adas[ıi]\s+Notu/i,
    /Zemin\s+Durumu/i,
    /Hava\s+Mania/i,
    /Parselasyon/i,
    /\b[0-9]{1,2}[./][0-9]{1,2}[./][0-9]{4}\s+Tarihli[^.]*Parselasyon/i,
    /Enc[uü]men\s+Tasdikli\s+Parselasyon/i,
    /Kadastro\s+Parsel/i,
    /Y[üu]r[üu]rl[üu]kteki\s+[İI]mar\s+Plan[ıi]/i,
  ];
  const indexes = boundaryPatterns
    .map((pattern) => {
      const match = text.match(pattern);
      return match ? match.index : -1;
    })
    .filter((index) => index > 0);
  if (!indexes.length) return text;
  return cleanImarToken(text.slice(0, Math.min(...indexes)));
}

function extractImarLegendFromLines(lines) {
  const source = Array.isArray(lines) ? lines : [];
  const start = source.findIndex((line) => foldTurkish(line).includes("PLAN FONKSIYON"));
  if (start < 0) return "";

  const items = [];
  const seen = new Set();
  for (const line of source.slice(start + 1)) {
    const raw = cleanImarToken(line);
    if (!raw) continue;
    const folded = foldTurkish(raw);

    if (
      folded.includes("BINA YUKSEKLIGI")
      || folded.includes("KAT ADEDI")
      || folded.includes("ON BAHCE")
      || folded.includes("YAN BAHCE")
      || folded.includes("ARKA BAHCE")
      || folded.includes("INSAAT NIZAMI")
      || folded.includes("TAKS")
      || folded.includes("KAKS")
      || folded.includes("EMSAL")
      || folded.includes("KOT ALINACAK")
      || folded.includes("BINA DERINLIGI")
      || folded.includes("KADASTRO PARSEL")
    ) {
      break;
    }

    if (
      folded.includes("PLAN FONKSIYON")
      || folded.includes("FONKSIYON UYARI")
      || folded.includes("PLAN NOT")
      || folded.includes("PARANTEZ")
      || folded.includes("GOSTERIR")
      || folded.includes("TAPU ALANI")
      || folded.includes("UYGULAMA IMAR PLANI")
    ) {
      continue;
    }

    if (!/\b(ALANI|BOLGESI|BOLGE|KONUT|TICARET|SANAYI|KIRSAL|KENTSEL|TURIZM|REKREASYON|PARK|YESIL)\b/.test(folded)) {
      continue;
    }

    const item = cleanImarLegendItem(raw);
    if (!item) continue;
    if (hasImarLegendAreaParenthesis(raw)) {
      return item;
    }
    const key = foldTurkish(item);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }

  return items.join(", ");
}

function hasImarLegendAreaParenthesis(value) {
  return /\([^)]*\d+(?:[.,]\d+)?\s*m\s*(?:²|2)?[^)]*\)/i.test(String(value || ""));
}

function cleanImarLegendItem(value) {
  return globalThis.RaporImarNormalizer.cleanImarLegendItem(value);
}

function cleanImarPlanName(value) {
  return globalThis.RaporImarNormalizer.cleanImarPlanName(value);
}

function normalizeImarSetbackToken(value) {
  const clean = cleanImarToken(value);
  if (!clean || clean === "-") return "";
  if (/^[0-9]+(?:[.,][0-9]+)?\s*m?$/i.test(clean)) return normalizeMeterToken(clean);
  return clean;
}

function formatImarAddressStreet(value) {
  const raw = cleanImarToken(value);
  if (!raw) return "";
  const shortMatch = raw.match(/^(.+?)\s+(SK|SK\.|SOK|SOK\.|CD|CD\.|CAD|CAD\.|BLV|BLV\.|BUL|BUL\.)$/i);
  if (!shortMatch) return formatStreetWithType(raw);
  const typeMap = {
    SK: "Sokak",
    SOK: "Sokak",
    CD: "Caddesi",
    CAD: "Caddesi",
    BLV: "Bulvarı",
    BUL: "Bulvarı",
  };
  const key = shortMatch[2].replace(/\./g, "").toLocaleUpperCase("tr");
  const name = toTitleCaseTr(shortMatch[1]);
  return `${name} ${typeMap[key] || ""}`.trim();
}

function normalizeImarDate(value) {
  const match = String(value || "").match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}.${match[2].padStart(2, "0")}.${match[3]}`;
}

function normalizeDecimalToken(value) {
  const clean = cleanImarToken(value);
  if (!clean || clean === "-") return "";
  return clean.replace(",", ".");
}

function normalizeMeterToken(value) {
  const clean = cleanImarToken(value);
  if (!clean || clean === "-") return "";
  if (/^serbest$/i.test(clean)) return "Serbest";
  return /\bm\b/i.test(clean) ? clean : `${clean} m`;
}

function normalizeImarPlanFunction(value) {
  return globalThis.RaporImarNormalizer.normalizeImarPlanFunction(value);
}

function normalizeImarLegendLabel(value) {
  return globalThis.RaporImarNormalizer.normalizeImarLegendLabel(value);
}

function imarNizamCodeToLabel(value) {
  const clean = cleanImarToken(value);
  const upper = clean.toLocaleUpperCase("tr").replace(/\s+/g, "");
  if (upper === "A") return "Ayrık";
  if (upper === "B") return "Bitişik";
  if (upper === "BL") return "Blok";
  if (upper === "IK" || upper === "İK") return "İkiz";
  if (upper === "CB") return "Çekme bölge";
  return clean;
}

function detectImarNizamFromText(text) {
  const folded = foldTurkish(text);
  const codePatterns = [
    /\b(BL|IK|CB)\s*[-–—]?\s*(\d{1,2})\b/g,
    /\b([AB])\s*[-–—]\s*(\d{1,2})\b/g,
  ];

  for (const pattern of codePatterns) {
    for (const match of folded.matchAll(pattern)) {
      const code = match[1] === "IK" ? "İK" : match[1];
      const label = imarNizamCodeToLabel(code);
      if (label && /^\d{1,2}$/.test(match[2])) {
        return { insaatNizami: label, katAdedi: match[2] };
      }
    }
  }

  const textPatterns = [
    [/BLOK\s+NIZAM/, "Blok"],
    [/BITISIK\s+NIZAM/, "Bitişik"],
    [/AYRIK\s+NIZAM/, "Ayrık"],
    [/IKIZ\s+NIZAM/, "İkiz"],
  ];
  const found = textPatterns.find(([pattern]) => pattern.test(folded));
  return found ? { insaatNizami: found[1], katAdedi: "" } : { insaatNizami: "", katAdedi: "" };
}

function detectImarFunctionFromText(text) {
  return globalThis.RaporImarNormalizer.detectImarFunctionFromText(text);
}

function calculateImarKatFromHeight(heightValue) {
  const match = String(heightValue || "").replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return "";
  const height = Number(match[1]);
  if (!Number.isFinite(height) || height <= 0.5) return "";
  const kat = Math.round((height - 0.5) / 3);
  return kat > 0 ? String(kat) : "";
}

function extractEkbDocumentNo(text) {
  const belgePattern = /\b([A-Z]\d[A-Z0-9]{11})\b/i;
  const windIndex = foldTurkish(text).search(/RUZGAR\s+ENERJISI/);
  if (windIndex >= 0) {
    const match = text.slice(windIndex).match(belgePattern);
    if (match) return match[1].toUpperCase();
  }
  const labeled = text.match(/Numaras[ıi]\s*:?\s*([A-Z]\d[A-Z0-9]{11})\b/i);
  if (labeled) return labeled[1].toUpperCase();
  const fallback = text.match(belgePattern);
  return fallback ? fallback[1].toUpperCase() : "";
}

function extractEkbDates(lines) {
  const datePattern = /\b(\d{1,2}\.\d{1,2}\.\d{4})\b/g;
  const allDates = lines.flatMap((line, lineIndex) =>
    [...line.matchAll(datePattern)]
      .map((match) => ({
        value: normalizeEkbDate(match[1]),
        lineIndex,
        index: match.index || 0,
      }))
      .filter((date) => date.value),
  );
  const uniqueDates = [...new Set(allDates.map((date) => date.value))];
  let issueDate = "";
  let validUntil = "";

  lines.forEach((line) => {
    const folded = foldTurkish(line);
    const date = normalizeEkbDate((line.match(/\b(\d{1,2}\.\d{1,2}\.\d{4})\b/) || [])[1]);
    if (!date) return;
    if (!issueDate && /VERILIS\s+TARIHI/.test(folded)) issueDate = date;
    if (!validUntil && /(SON\s+)?GECERLILIK\s+TARIHI/.test(folded)) validUntil = date;
  });

  const tenYearPair = findEkbTenYearDatePair(allDates);
  if (tenYearPair && (!issueDate || !validUntil)) {
    issueDate = issueDate || tenYearPair.issueDate;
    validUntil = validUntil || tenYearPair.validUntil;
  }

  if (issueDate && !validUntil) {
    const expectedValidUntil = addYearsToTrDate(issueDate, 10);
    if (uniqueDates.includes(expectedValidUntil)) validUntil = expectedValidUntil;
  }
  if (validUntil && !issueDate) {
    const expectedIssueDate = addYearsToTrDate(validUntil, -10);
    if (uniqueDates.includes(expectedIssueDate)) issueDate = expectedIssueDate;
  }

  if (!issueDate && uniqueDates.length >= 1) {
    issueDate = uniqueDates[uniqueDates.length >= 2 ? uniqueDates.length - 2 : 0];
  }
  if (!validUntil && uniqueDates.length >= 2) {
    validUntil = uniqueDates[uniqueDates.length - 1];
  }

  return { issueDate, validUntil };
}

function normalizeEkbDate(value) {
  const match = String(value || "").match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}.${match[2].padStart(2, "0")}.${match[3]}`;
}

function findEkbTenYearDatePair(dates) {
  const list = Array.isArray(dates) ? dates.filter((date) => date.value) : [];
  let pair = null;
  for (let i = 0; i < list.length; i += 1) {
    const expectedValidUntil = addYearsToTrDate(list[i].value, 10);
    if (!expectedValidUntil) continue;
    const later = list.slice(i + 1).find((date) => date.value === expectedValidUntil);
    if (later) {
      pair = { issueDate: list[i].value, validUntil: later.value };
    }
  }
  return pair;
}

function addYearsToTrDate(value, years) {
  const normalized = normalizeEkbDate(value);
  const match = normalized.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";
  const year = Number(match[3]) + years;
  return `${match[1]}.${match[2]}.${String(year).padStart(4, "0")}`;
}

function extractEkbClasses(lines, text) {
  let energyClass = pickClassNearLabel(lines, /PERFORMANS\s+SINIFI|ENERJI\s+SINIFI/);
  let emissionClass = pickClassNearLabel(lines, /EMISYON\s+SINIFI|SERA\s+GAZI/);

  if (!energyClass) {
    energyClass = findGraphClass(lines, 0);
  }
  if (!emissionClass) {
    emissionClass = findGraphClass(lines, 1);
  }
  if (!emissionClass && energyClass && /SERA|EMISYON/i.test(foldTurkish(text))) {
    emissionClass = findGraphClass(lines, 1) || "";
  }

  return { energyClass, emissionClass };
}

function pickClassNearLabel(lines, labelPattern) {
  for (let i = 0; i < lines.length; i += 1) {
    const folded = foldTurkish(lines[i]);
    if (!labelPattern.test(folded)) continue;
    const sameLine = lines[i].match(/\b([A-G])\b(?!.*\b[A-G]\b)/i);
    if (sameLine) return sameLine[1].toUpperCase();
    for (let offset = 1; offset <= 3; offset += 1) {
      const next = lines[i + offset] || "";
      const match = next.match(/\b([A-G])\b(?!.*\b[A-G]\b)/i);
      if (match) return match[1].toUpperCase();
    }
  }
  return "";
}

function findGraphClass(lines, occurrenceIndex = 0) {
  const matches = [];
  lines.forEach((line) => {
    const graphMatch =
      line.match(/\b\d+\s*[-–]\s*\d+\s+\d+\s+\d+\s*[-–]\s*\d+\s+\d+\s+([A-G])\b/i) ||
      line.match(/\b\d+\s*[-–]\s*\d+\s+\d+\s+([A-G])\s*$/i) ||
      line.match(/\b\d{1,3}(?:\.\d{3})+,\d+\s+([A-G])\s*$/i);
    if (graphMatch) matches.push(graphMatch[1].toUpperCase());
  });
  return matches[occurrenceIndex] || matches[0] || "";
}

function dateTrToIso(value) {
  const match = normalizeEkbDate(value).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function dateIsoToTr(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value || "";
}

function refreshReviewedDocumentsDescriptionFromCurrentRows() {
  state.fields.reviewedDocumentsDescription = buildReviewedDocumentsDescription();
  const control = document.querySelector('[data-field="reviewedDocumentsDescription"]');
  if (control) {
    control.value = state.fields.reviewedDocumentsDescription || "";
    markFieldSourceState(control, "reviewedDocumentsDescription", true);
  }
}

function refreshReviewedDocumentsDescriptionFromCurrentFields(changedKey) {
  if (!["municipalityInspectionDate", "appointmentDate", "district", "titleDistrict", "documentReviewInstitution"].includes(changedKey)) return;
  if (["district", "titleDistrict"].includes(changedKey)) {
    ensureDocumentReviewInstitutionDefault();
  }
  if (!(state.tables.documents || []).some((row) => Object.values(row || {}).some((value) => String(value || "").trim()))) return;
  refreshReviewedDocumentsDescriptionFromCurrentRows();
}

function ensureDocumentReviewInstitutionDefault() {
  if (String(state.fields.documentReviewInstitution || "").trim()) return;
  const district = normalizeReportTitleText(state.fields.titleDistrict || state.fields.district || "").trim();
  if (!district) return;
  state.fields.documentReviewInstitution = `${district} Belediyesi`;
}

function buildReviewedDocumentsDescription() {
  const rows = (state.tables.documents || []).map(normalizeReviewedDocumentRow).filter((row) => row.type);
  if (!rows.length) return "";

  const permitGroups = new Map();
  const occupancyTexts = [];

  rows.forEach((row) => {
    if (isOccupancyPermitDocument(row.type)) {
      occupancyTexts.push(buildOccupancyPermitDocumentSentence(row));
      return;
    }
    if (isPermitLikeDocument(row.type) && row.date && row.no) {
      const prefix = buildDocumentArchivePrefix(row.institution);
      if (!permitGroups.has(prefix)) permitGroups.set(prefix, []);
      permitGroups.get(prefix).push(formatReviewedDocumentReference(row));
    }
  });

  const parts = [];
  if (permitGroups.size) {
    permitGroups.forEach((permitItems, prefix) => {
      parts.push(`${prefix} yer alan ${joinTurkishList(permitItems)} incelenmiştir.`);
    });
  } else {
    const prefix = buildDocumentArchivePrefix();
    parts.push(`${prefix} yapılan incelemelerde taşınmaza ait herhangi bir ruhsat bulunmamaktadır.`);
  }
  parts.push(...(occupancyTexts.length ? occupancyTexts : [buildOccupancyPermitDocumentSentence({})]));

  return normalizeReportDescriptionText(parts.join("\n\n"));
}

function normalizeReviewedDocumentRow(row = {}) {
  const migrated = normalizeReviewedDocumentStorageRow(row);
  return {
    type: normalizeReportTitleText(migrated.c0 || "").trim(),
    institution: normalizeReportTitleText(migrated.c1 || buildDefaultDocumentReviewInstitution() || "").trim(),
    date: dateIsoToTr(migrated.c2 || "").trim(),
    no: String(migrated.c3 || "").trim(),
    scope: normalizeReviewedDocumentScope(migrated.c4 || ""),
  };
}

function normalizeReviewedDocumentStorageRow(row = {}) {
  if (row.c4 !== undefined) return row;
  const c1LooksLikeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(row.c1 || "")) || /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(String(row.c1 || ""));
  const c1LooksLikeInstitution = /BELEDIYE|BAKANLIK|IDARE|BÜYÜKŞEHIR|BÜYÜKSEHIR|ÖZEL|OZEL/i.test(foldTurkish(row.c1 || ""));
  if (!c1LooksLikeDate && c1LooksLikeInstitution) return row;
  return {
    c0: row.c0 || "",
    c1: buildDefaultDocumentReviewInstitution(),
    c2: row.c1 || "",
    c3: row.c2 || "",
    c4: row.c3 || "",
  };
}

function isPermitLikeDocument(type) {
  const folded = foldTurkish(type);
  return /RUHSAT/.test(folded) || /YAPI\s*KAYIT\s*BELGESI/.test(folded);
}

function isOccupancyPermitDocument(type) {
  return /YAPI\s*KULLAN/.test(foldTurkish(type));
}

function buildOccupancyPermitDocumentSentence(row) {
  const prefix = buildDocumentArchivePrefix(row.institution);
  if (!row.date || !row.no) {
    return `${prefix} yapılan incelemelerde taşınmaza ait yapı kullanma izin belgesi bulunamamıştır.`;
  }
  return `${prefix} yer alan ${formatReviewedDocumentReference(row)} incelenmiştir.`;
}

function buildMunicipalityArchivePrefix() {
  return buildDocumentArchivePrefix();
}

function buildDocumentArchivePrefix(institutionValue = "") {
  const date = dateIsoToTr(state.fields.municipalityInspectionDate || state.fields.appointmentDate || "");
  const institution = normalizeReportTitleText(
    institutionValue || state.fields.documentReviewInstitution || buildDefaultDocumentReviewInstitution() || ""
  ).trim();
  const archiveText = formatDocumentArchiveLocation(institution);
  if (date && archiveText) return `${date} tarihinde, ${archiveText}`;
  if (date) return `${date} tarihinde, inceleme yapılan kurum imar arşiv dosyasında`;
  if (archiveText) return archiveText;
  return "İnceleme yapılan kurum imar arşiv dosyasında";
}

function formatDocumentArchiveLocation(institution) {
  const clean = normalizeReportTitleText(institution || "").trim();
  if (!clean) return "";
  if (/BELEDIYE/.test(foldTurkish(clean))) return `${clean} İmar Arşiv dosyasında`;
  return `${clean} arşivinde`;
}

function buildDefaultDocumentReviewInstitution() {
  const district = normalizeReportTitleText(state.fields.titleDistrict || state.fields.district || "").trim();
  return district ? `${district} Belediyesi` : "";
}

function formatReviewedDocumentReference(row) {
  const scope = row.scope ? ` (${row.scope})` : "";
  return `${row.date} tarih, ${row.no} sayılı ${row.type}${scope}`;
}

function normalizeReviewedDocumentScope(value) {
  const text = normalizeReportDescriptionText(value || "").trim();
  const folded = foldTurkish(text).replace(/\s+/g, " ").trim();
  if (!folded) return "";
  if (folded === "TAMAMI") return "Tamamı için";
  const blockMatch = folded.match(/^([A-ZÇĞİÖŞÜ0-9]+)\s+BLOK$/);
  if (blockMatch) return `${blockMatch[1]} Blok Tamamı için`;
  return text;
}

function joinTurkishList(items = []) {
  const clean = items.filter(Boolean);
  if (clean.length <= 1) return clean[0] || "";
  if (clean.length === 2) return `${clean[0]} ve ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} ve ${clean[clean.length - 1]}`;
}

function foldTurkish(value) {
  return String(value || "")
    .toLocaleUpperCase("tr")
    .replace(/İ/g, "I")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseAddressCodeText(text) {
  const clean = normalizeAddressText(text);
  const addressRaw = findAddressRaw(clean);
  const fromAddress = parseAddressLine(addressRaw);
  const uavt = extractUavt(clean);
  const tableValues = extractAddressTableValues(getAddressTableText(clean), uavt);
  const neighborhood = cleanNeighborhoodName(fromAddress.neighborhood || extractNeighborhoodFromAddressText(clean));

  return {
    city: "",
    district: "",
    neighborhood,
    street: fromAddress.street,
    outerDoor: tableValues.outerDoor || fromAddress.outerDoor,
    innerDoor: tableValues.innerDoor,
    addressSiteName: tableValues.siteName,
    addressBlockName: "",
    blockName: "",
    uavt,
    postalCode: tableValues.postalCode,
    addressRaw,
  };
}

function normalizeAddressText(text) {
  return String(text || "")
    .replace(/[\uE000-\uF8FF]/g, " ")
    .replace(/\r+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function getAddressTableText(text) {
  const normalized = String(text || "");
  const tableStart = normalized.search(/Numarataj\s*Bilgileri|Kimlik\s*No\s*Ada|Kimlik\s*NoAda/i);
  const tableEnd = normalized.search(/\b[A-ZÇĞİÖŞÜ]+\s*\/\s*[A-ZÇĞİÖŞÜ]+\s*\/\s*[^/]*MAHALLESİ\s*\/\s*[^/]*(?:Sokak|Cadde|Bulvar)/i);
  const tableSlice = tableStart >= 0
    ? normalized.slice(tableStart, tableEnd > tableStart ? tableEnd : undefined)
    : normalized;

  return tableSlice
    .split(/\n+/)
    .filter((line) => !(line.includes("/") && /mesken|kullanım|kullanim|kapı|kapi/i.test(line) && !/Numarataj|Kimlik\s*No|Bina\s*Ana/i.test(line)))
    .join("\n");
}

function findAddressRaw(text) {
  const headerCandidate = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(extractAddressCandidateFromLine)
    .find(Boolean);
  if (headerCandidate) return headerCandidate;

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const line = lines.find((item) => item.includes("/") && /İç\s*Kapı|Ic\s*Kapi|Kullanım|Kullanim|Mesken/i.test(item));
  if (line) return line.replace(/^[^\p{L}\d]*(?=[A-ZÇĞİÖŞÜ])/u, "").trim();

  const inline = text.match(/([A-ZÇĞİÖŞÜ]+)\s*\/\s*([A-ZÇĞİÖŞÜ]+)\s*\/\s*[^]+?(?:İç\s*Kapı\s*No\s*:?\s*\d+|Ic\s*Kapi\s*No\s*:?\s*\d+)/i);
  return inline ? inline[0].trim() : "";
}

function extractAddressCandidateFromLine(line) {
  if (!String(line || "").includes("/")) return "";
  const direct = String(line || "").match(/([A-ZÇĞİÖŞÜ]+)\s*\/\s*([A-ZÇĞİÖŞÜ]+)\s*\/\s*([^/]*\b(?:MAHALLESİ|MAHALLE|MAH\.?|MH\.?))\s*\/\s*([^/]*(?:Sokak|Cadde|Bulvar)[^/]*)/i);
  if (direct) {
    return direct.slice(1, 5).map((part) => part.trim()).join(" / ");
  }

  const parts = String(line || "")
    .replace(/^[^\p{L}\d]+/u, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  for (let start = 0; start <= Math.max(0, parts.length - 4); start += 1) {
    const candidate = parts.slice(start, start + 4);
    if (isLikelyAddressHeader(candidate)) return candidate.join(" / ");
  }

  return "";
}

function isLikelyAddressHeader(parts) {
  if (parts.length < 4) return false;
  const firstTwo = `${parts[0] || ""} ${parts[1] || ""}`;
  const neighborhood = parts[2] || "";
  const street = parts[3] || "";
  if (/(cerez|kimlik|kapi|kapı|blok|posta|numarataj|bagimsiz|bağımsız)/i.test(firstTwo)) return false;
  return /\b(?:mahalle|mah\.?|mh\.?)\b/i.test(neighborhood) && /sokak|cadde|bulvar|\((?:sokak|cadde|bulvar)\)/i.test(street);
}

function extractNeighborhoodFromAddressText(text) {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const patterns = [
    /(?:^|\/|\s)([A-ZÇĞİÖŞÜ0-9.'’\-\s]{2,80}?)\s+(?:MAHALLESİ|MAHALLE|MAH\.?|MH\.?)(?=\s|\/|,|$)/i,
    /(?:İdari|Idari)?\s*Mahalle(?:si)?\s*[:\-]?\s*([A-ZÇĞİÖŞÜ0-9.'’\-\s]{2,80})/i,
  ];

  for (const line of lines) {
    if (/numarataj|kimlik\s*no|posta\s*kod|kapı|kapi/i.test(line)) continue;
    for (const pattern of patterns) {
      const match = line.match(pattern);
      const value = match ? cleanupAddressNeighborhoodCandidate(match[1]) : "";
      if (value) return value;
    }
  }

  const compact = String(text || "").replace(/\s+/g, " ");
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    const value = match ? cleanupAddressNeighborhoodCandidate(match[1]) : "";
    if (value) return value;
  }
  return "";
}

function cleanupAddressNeighborhoodCandidate(value) {
  let text = String(value || "")
    .replace(/.*\//g, "")
    .replace(/\b(?:İl|Il|İlçe|Ilce|Adres|Sokak|Cadde|Bulvar)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  text = text.split(/\s+(?:Sokak|Cadde|Bulvar)\b/i)[0].trim();
  if (!text || text.length < 2) return "";
  return text;
}

function parseAddressLine(addressRaw) {
  const result = {
    city: "",
    district: "",
    neighborhood: "",
    street: "",
    outerDoor: "",
    innerDoor: "",
  };

  if (!addressRaw) return result;

  const parts = addressRaw.split("/").map((part) => part.trim()).filter(Boolean);
  result.city = "";
  result.district = "";
  result.neighborhood = parts[2] || "";
  const streetPart = parts[3] || "";
  result.street = /sokak|cadde|bulvar|\((?:sokak|cadde|bulvar)\)/i.test(streetPart)
    ? formatStreetWithType(streetPart)
    : "";

  const doorPart = parts[4] || "";
  result.outerDoor = parseOuterDoor(doorPart);

  const innerMatch = addressRaw.match(/(?:İç|Ic|Iç|İc|ic|iç)?\s*Kap(?:ı|i|I|İ)\s*No\s*:?\s*([0-9A-Za-zÇĞİÖŞÜçğıöşü/-]+)/i);
  result.innerDoor = innerMatch ? onlyDigits(innerMatch[1]) || innerMatch[1].trim() : "";

  result.outerDoor = "";
  result.innerDoor = "";
  return result;
}

function parseOuterDoor(text) {
  const first = String(text || "").split("-")[0].trim();
  const match = first.match(/^([0-9]+[A-Za-zÇĞİÖŞÜçğıöşü]*)/);
  return match ? match[1] : "";
}

function formatStreetWithType(value) {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  const typeMatch = raw.match(/\((Sokak|Cadde|Bulvar)\)|\b(Sokak|Cadde|Bulvarı|Bulvar)\b/i);
  const streetType = normalizeStreetType(typeMatch ? (typeMatch[1] || typeMatch[2]) : "");
  const name = raw
    .replace(/\(.+?\)/g, "")
    .replace(/(Sokak|Cadde|Bulvarı|Bulvar)/gi, "")
    .trim();
  return [toTitleCaseTr(name), streetType].filter(Boolean).join(" ").trim();
}

function normalizeStreetType(value) {
  const text = String(value || "").toLocaleLowerCase("tr");
  if (text.includes("cadde")) return "Caddesi";
  if (text.includes("bulvar")) return "Bulvarı";
  if (text.includes("sokak")) return "Sokak";
  return "";
}

function toTitleCaseTr(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .split(/(\s+|-)/)
    .map((part) => (/^\s+$|^-$/.test(part) || !part ? part : part.charAt(0).toLocaleUpperCase("tr") + part.slice(1)))
    .join("");
}

function normalizeReportFieldValue(key, value) {
  const text = String(value ?? "");
  if (!text.trim()) return text.trim();
  if (key === "postalCode") return normalizePostalCodeValue(text);
  const field = findReportFieldDefinition(key);
  if (isReportTechnicalField(key, field)) return text.trim();
  if (isReportDescriptionField(key, field)) return normalizeReportDescriptionText(text);
  if (isReportTitleField(key, field)) return normalizeReportTitleText(text);
  return text.trim();
}

function normalizePostalCodeValue(value) {
  const digits = onlyDigits(value);
  if (digits.length === 4) return digits.padStart(5, "0");
  if (digits.length === 5) return digits;
  return String(value || "").trim();
}

function normalizeReportStateFields(targetState) {
  let changed = false;
  Object.entries(targetState.fields || {}).forEach(([key, value]) => {
    if (typeof value !== "string") return;
    const normalized = normalizeReportFieldValue(key, value);
    if (normalized !== value) {
      targetState.fields[key] = normalized;
      changed = true;
    }
  });

  Object.entries(targetState.tables || {}).forEach(([tableKey, rows]) => {
    if (!Array.isArray(rows)) return;
    const section = sections.find((item) => item.id === tableKey);
    rows.forEach((row) => {
      if (!row || typeof row !== "object") return;
      Object.entries(row).forEach(([cellKey, value]) => {
        if (typeof value !== "string") return;
        const columnIndex = Number(String(cellKey).replace(/^c/, ""));
        const column = section?.table?.columns?.[columnIndex] || "";
        const normalized = normalizeReportTableValue(section, column, value);
        if (normalized !== value) {
          row[cellKey] = normalized;
          changed = true;
        }
      });
    });
  });

  return changed;
}

function findReportFieldDefinition(key) {
  for (const section of sections) {
    const field = (section.fields || []).find((item) => item.key === key);
    if (field) return field;
  }
  return null;
}

function isReportTechnicalField(key, field = {}) {
  if (!field) return false;
  if (field.hidden) return true;
  if (["date", "time", "number", "select"].includes(field.type)) return true;
  return /(^|\.)(date|time|no|number|kod|code|uavt|postal|postcode|latitude|longitude|ada|parsel|pafta|share|hisse|amount|tutar|distance|mesafe)$/i.test(String(key || ""))
    || /^(planScale|taks|kaks|hmax|floorCount|frontGarden|sideGarden|roadSetback|outerDoor|innerDoor|buildingCode|postalCode|parcelArea|grossArea|netArea|legalArea|currentArea|legalValue|currentValue|legalRent|currentRent|landUnitValue|takbisReportTime|takbisTime|nearestNeighborhoodDistance|boundNeighborhoodDistance|districtCenterDistance|cityCenterDistance)$/i.test(String(key || ""));
}

function isReportDescriptionField(key, field = {}) {
  if (!field) return false;
  return field.type === "textarea"
    || /(note|summary|description|explanation|transport|nearby|planning|restriction|conformity|features|codes|açıklama|aciklama|notu)$/i.test(String(key || ""))
    || /Açıklama|Not|Tarif|Yakın Çevre|Ulaşım|Uygunluk|Özellik|Risk/i.test(String(field.label || ""));
}

function isReportTitleField(key, field = {}) {
  if (!field) return false;
  if (field.type && field.type !== "text" && field.type !== "textarea") return false;
  return !isReportDescriptionField(key, field) && !isReportTechnicalField(key, field);
}

function normalizeReportTableValue(section, column, value) {
  const text = String(value ?? "");
  if (!text.trim()) return text.trim();
  if (section?.id === "encumbranceMortgages" && /ipotek lehdar/i.test(String(column || ""))) {
    return normalizeMortgageCreditorDisplay(text);
  }
  if (isReportTechnicalTableColumn(column)) return text.trim();
  if (isReportDescriptionTableColumn(column)) return normalizeReportDescriptionText(text);
  return normalizeReportTitleText(text);
}

function isReportTechnicalTableColumn(column) {
  return /(hisse|tarih|yevmiye|no|tutar|derece|alan|fiyat|düzeltme|duzeltme)/i.test(String(column || ""));
}

function isReportDescriptionTableColumn(column) {
  return /(açıklama|aciklama|kapsam|edinme sebebi)/i.test(String(column || ""));
}

function normalizeReportTitleText(value) {
  return preserveReportSpecialWords(toTitleCaseTr(normalizeReportWhitespace(value)));
}

function normalizeReportDescriptionText(value) {
  const text = normalizeReportWhitespace(value)
    .split("\n")
    .map((line) => normalizeReportSentenceLine(line))
    .join("\n")
    .trim();
  return normalizeReportNumberFormats(preserveReportSpecialWords(text));
}

function normalizeReportSentenceLine(value) {
  const line = String(value || "").trim();
  if (!line) return "";
  const normalized = shouldLowercaseReportLine(line)
    ? line.toLocaleLowerCase("tr")
    : line;
  const sentenceCased = normalized.replace(/(^|[.!?]\s+)([a-zçğıöşü])/g, (match, prefix, letter) => prefix + letter.toLocaleUpperCase("tr"));
  return normalizeReportProperPhrases(sentenceCased);
}

function shouldLowercaseReportLine(value) {
  const letters = String(value || "").replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "");
  if (letters.length < 4) return false;
  const upperLetters = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, "");
  return upperLetters.length / letters.length > 0.65;
}

function normalizeReportWhitespace(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeReportProperPhrases(value) {
  return String(value || "").replace(
    /\b([a-zçğıöşü0-9.'’/-]+(?:\s+[a-zçğıöşü0-9.'’/-]+){0,8}\s+imar\s+plan[ıi]?)\b/gi,
    (match) => {
      const folded = foldTurkish(match);
      if (!/(UYGULAMA|NAZIM|REVIZYON|ILAVE|MERKEZ|KORUMA|CEVRE)/.test(folded)) return match;
      return toTitleCaseTr(match);
    },
  );
}

function preserveReportSpecialWords(value) {
  const replacements = [
    ["takbis", "TAKBİS"],
    ["uavt", "UAVT"],
    ["ekb", "EKB"],
    ["taks", "TAKS"],
    ["kaks", "KAKS"],
    ["hmax", "Hmax"],
    ["tl", "TL"],
    ["m²", "m²"],
    ["m2", "m²"],
  ];
  let text = String(value || "");
  replacements.forEach(([from, to]) => {
    if (from === "tl") {
      text = text.replace(/(^|[^A-Za-zÇĞİÖŞÜçğıöşü])tl(?=$|[^A-Za-zÇĞİÖŞÜçğıöşü])/gi, `$1${to}`);
      return;
    }
    text = text.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi"), to);
  });
  return text;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toTitleCaseTakbisEntity(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const compact = word.replace(/[^A-Za-z0-9İIıiŞşĞğÜüÖöÇç]/g, "");
      if (word.includes(".") && compact.length <= 6) return word.toLocaleUpperCase("tr");
      return toTitleCaseTr(word);
    })
    .join(" ")
    .trim();
}

function extractUavt(text) {
  const preferred = [
    /Bağımsız\s*Bölüm\s*Kimlik\s*No\s*:?\s*([0-9]{10})/i,
    /Bagimsiz\s*Bolum\s*Kimlik\s*No\s*:?\s*([0-9]{10})/i,
    /Kimlik\s*No[^0-9]{0,80}([0-9]{10})[^0-9]{0,30}(?:İç|Ic|Iç|İc)\s*Kap(?:ı|i|I|İ)/i,
  ];

  for (const pattern of preferred) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  const all10 = [...text.matchAll(/\b[0-9]{10}\b/g)].map((match) => match[0]);
  return all10.length ? all10[all10.length - 1] : "";
}

function extractAddressTableValues(text, preferredUavt = "") {
  const values = {
    siteName: "",
    blockName: "",
    outerDoor: "",
    innerDoor: "",
    postalCode: "",
  };

  const compact = normalizeAddressTableSpacing(text.replace(/\s+/g, " ").trim());
  const byUavt = extractAddressTableValuesByUavt(compact, preferredUavt || extractUavt(compact));
  if (byUavt) {
    const names = splitRepeatedName(beforeNumericCleanup(byUavt.nameSegment));
    values.siteName = chooseSiteApartmentName(names);
    values.blockName = "";
    values.outerDoor = byUavt.outerDoor;
    values.innerDoor = byUavt.innerDoor;
  }
  const afterType = compact.match(/Bina\s*Ana\s*G(?:iriş|iris|iri[şs]|iri.)\s*(.+?)\s+([0-9A-Za-zÇĞİÖŞÜçğıöşü/-]+)\s+([0-9]{10})\s+([0-9A-Za-zÇĞİÖŞÜçğıöşü/-]+)/i);
  if (afterType) {
    const names = splitRepeatedName(beforeNumericCleanup(afterType[1]));
    const siteOrApartment = chooseSiteApartmentName(names);
    if (siteOrApartment && (!values.siteName || siteOrApartment.length > values.siteName.length)) {
      values.siteName = siteOrApartment;
      values.blockName = "";
    }
    values.outerDoor = values.outerDoor || afterType[2];
    values.innerDoor = values.innerDoor || afterType[4];
  }

  if (!values.outerDoor || !values.innerDoor || !values.siteName) {
    const fallback = matchAddressTableRowFallback(compact);
    if (fallback) {
      const names = splitRepeatedName(beforeNumericCleanup(fallback[1]));
      values.siteName = values.siteName || chooseSiteApartmentName(names);
      values.blockName = "";
      values.outerDoor = values.outerDoor || fallback[2];
      values.innerDoor = values.innerDoor || fallback[4];
    }
  }

  const postalMatch = compact.match(/Posta\s*Kod[^\d]{0,30}([0-9]{5})/i);
  if (postalMatch) values.postalCode = postalMatch[1];

  return values;
}

function extractAddressTableValuesByUavt(text, uavt) {
  const compact = String(text || "");
  const uavtValue = String(uavt || "").trim();
  if (!uavtValue) return null;

  const index = compact.indexOf(uavtValue);
  if (index < 0) return null;

  const before = compact.slice(0, index).trim();
  const after = compact.slice(index + uavtValue.length).trim();
  const beforeTokens = before.split(/\s+/).filter(Boolean);
  const outerDoor = beforeTokens.pop() || "";
  if (!outerDoor) return null;

  let typeIndex = -1;
  for (let i = 0; i < beforeTokens.length - 2; i += 1) {
    if (/^Bina$/i.test(beforeTokens[i]) && /^Ana$/i.test(beforeTokens[i + 1]) && /^G/i.test(beforeTokens[i + 2])) {
      typeIndex = i + 3;
    }
  }

  const nameSegment = typeIndex >= 0 ? beforeTokens.slice(typeIndex).join(" ") : "";
  const innerMatch = after.match(/^([^\s]+)/);

  return {
    nameSegment,
    outerDoor,
    innerDoor: innerMatch ? innerMatch[1] : "",
  };
}

function matchAddressTableRowFallback(text) {
  const compact = String(text || "");
  const patterns = [
    /Bina\s*Ana\s*G\S*\s*(.+?)\s+([0-9A-Za-zÇĞİÖŞÜçğıöşü/-]+)\s+([0-9]{10})\s*([0-9A-Za-zÇĞİÖŞÜçğıöşü/-]+)/i,
    /Bina\s*Ana\s*G\S*\s*(.+?)\s+([0-9A-Za-z/-]+)\s+([0-9]{10})\s*([0-9A-Za-z/-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match) return match;
  }

  return null;
}

function normalizeAddressTableSpacing(text) {
  return String(text || "")
    .replace(/(Giriş)(?=[A-ZÇĞİÖŞÜ])/g, "$1 ")
    .replace(/(Giris)(?=[A-Z])/gi, "$1 ")
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü])([0-9]{1,5}\s+[0-9]{10})/g, "$1 $2")
    .replace(/([0-9]{10})([0-9A-Za-zÇĞİÖŞÜçğıöşü/-])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function beforeNumericCleanup(value) {
  return String(value || "")
    .replace(/\bKimlik\s*No\b.*$/i, "")
    .replace(/\bMesken\b.*$/i, "")
    .trim();
}

function splitRepeatedName(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return ["", ""];
  const apartmentOnly = text.match(/^[-–—]\s*(.+)$/);
  if (apartmentOnly) return ["", cleanAddressTableName(apartmentOnly[1])];
  const words = text.split(" ");

  for (let size = 1; size <= Math.floor(words.length / 2); size += 1) {
    const first = words.slice(0, size).join(" ");
    const second = words.slice(size, size * 2).join(" ");
    if (normalizeNameForCompare(first) === normalizeNameForCompare(second)) {
      return [cleanAddressTableName(first), cleanAddressTableName(second)];
    }
  }

  return [cleanAddressTableName(text), ""];
}

function chooseSiteApartmentName(names) {
  const siteName = cleanAddressTableName(names?.[0]);
  const apartmentName = cleanAddressTableName(names?.[1]);
  return siteName || apartmentName;
}

function cleanAddressTableName(value) {
  const text = String(value || "")
    .replace(/^[-–—]\s*/, "")
    .replace(/\s*[-–—]\s*$/, "")
    .replace(/\b[A-ZÇĞİÖŞÜ0-9]+\s*Blok\b/gi, "")
    .replace(/\bBlok\b/gi, "")
    .replace(/\s+\d+[A-ZÇĞİÖŞÜ]?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text === "-") return "";
  return toTitleCaseTr(text);
}

function normalizeNameForCompare(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replace(/[ıiİI]/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function applyAddressFieldsToReport(options = {}) {
  const fields = state.sourceValues.address?.fields || {};
  state.sourceConflicts.address = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (!value) return;
    const nextValue = key === "addressSiteName" ? cleanAddressTableName(value) : value;
    if (!nextValue) return;
    setFieldFromSource("address", key, nextValue, options);
  });
  syncAddressBlockFromTakbis(options);
  triggerPostalCodeLookupAfterAddressApply(fields);
}

function triggerPostalCodeLookupAfterAddressApply(fields = {}) {
  if (!fields.city && !fields.district && !fields.neighborhood) return;
  applyPostalCodeFromSelectedNeighborhood({ silent: true }).then((changed) => {
    if (!changed) return;
    autosave();
    if (activeSectionId === "address") renderSection();
    renderValidation();
    updateStatus();
  }).catch(() => {});
}

function applyTakbisTitleFieldsToReport(options = {}) {
  const fields = state.sourceValues.takbis?.fields || {};
  state.sourceConflicts.takbis = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (!value) return;
    setFieldFromSource("takbis", key, value, options);
  });
  if (fields.titleFloor) {
    setFieldFromSource("takbis", "addressFloor", fields.titleFloor, options);
  }
  applyAdministrativeNeighborhoodFallback("takbis", fields.titleNeighborhood);
  syncAddressBlockFromTakbis(options);
  refreshEnvironmentDescriptionFromCurrentFields("titleFloor");
}

function syncAddressBlockFromTakbis(options = {}) {
  const block = cleanTakbisValue(state.sourceValues.takbis?.fields?.titleBlockName || "");
  if (!block) return;
  setFieldFromSource("takbis", "addressBlockName", block, options);
}

function applyTakbisOwnersToTable(owners) {
  const ownerRows = (owners || []).map((owner) => ({
    c0: cleanTakbisOwnerDisplayName(owner.name || ""),
    c1: owner.share || "",
    c2: owner.acquisition || "",
    c3: dateIsoToTr(owner.date) || "",
    c4: owner.journalNo || "",
  }));
  state.tables.title = ownerRows.length
    ? ownerRows
    : Array.from({ length: sections.find((section) => section.id === "title")?.table?.rows || 3 }, () => ({}));
  refreshTitleOwnershipKindFromOwners();
}

function refreshTitleOwnershipKindFromOwners() {
  const nextKind = inferTitleOwnershipKindFromOwnerRows(state.tables.title || []);
  if (!nextKind) return;
  state.sourceValues.takbis = state.sourceValues.takbis || {};
  state.sourceConflicts.takbis = state.sourceConflicts.takbis || {};
  const currentValue = state.fields.titleOwnershipKind || "";
  const previousSourceValue = state.sourceValues.takbis?.applied?.titleOwnershipKind || "";
  setFieldFromSource("takbis", "titleOwnershipKind", nextKind);
  const wasApplied = !currentValue || currentValue === previousSourceValue;
  const control = document.querySelector('[data-field="titleOwnershipKind"]');
  if (control && wasApplied) {
    control.value = state.fields.titleOwnershipKind || "";
    markFieldSourceState(control, "titleOwnershipKind");
  }
  refreshShareExplanationFromCurrentFields("titleOwnershipKind");
}

function buildShareExplanation() {
  return "Değerleme konusu taşınmaz hisseli olup, TAŞINMAZIN TÜM HİSSELERİNİN (AÇIKTA HİSSE KALMAYACAK ŞEKİLDE) İPOTEK ALTINA ALINMASI ŞARTIYLA uzman kanaati SATILABİLİR olarak takdir edilmiştir.";
}

function refreshShareExplanationFromCurrentFields(changedKey = "") {
  if (changedKey && changedKey !== "titleOwnershipKind") return;
  const autoText = buildShareExplanation();
  const currentText = String(state.fields.shareExplanation || "").trim();
  const isAutoText = currentText === autoText;

  if (state.fields.titleOwnershipKind === "Hisseli Mülkiyet") {
    if (currentText && !isAutoText) return;
    state.fields.shareExplanation = autoText;
  } else if (isAutoText) {
    state.fields.shareExplanation = "";
  } else {
    return;
  }

  const control = document.querySelector('[data-field="shareExplanation"]');
  if (control && control.value !== state.fields.shareExplanation) {
    control.value = state.fields.shareExplanation;
  }
}

function inferTitleOwnershipKindFromOwnerRows(rows = []) {
  const filledRows = rows.filter((row) => cleanTakbisValue(row?.c0 || row?.c1 || row?.c2 || row?.c3 || row?.c4 || ""));
  if (!filledRows.length) return "";
  if (filledRows.length > 1) return "Hisseli Mülkiyet";
  const share = normalizeOwnerShareValue(filledRows[0]?.c1 || "");
  return share === "1/1" ? "Tam Mülkiyet" : "Hisseli Mülkiyet";
}

function normalizeOwnerShareValue(value) {
  return cleanTakbisValue(value)
    .replace(/\s+/g, "")
    .replace(/\\/g, "/");
}

function applyTakbisEncumbranceFieldsToReport(parsed, options = {}) {
  const fields = parsed?.fields || {};
  const values = {
    takbisDate: fields.takbisReportDate || "",
    takbisTime: fields.takbisReportTime || "",
  };

  Object.entries(values).forEach(([key, value]) => {
    setFieldFromSource("takbis", key, value, options);
  });
}

function applyTakbisEncumbrancesToTable(encumbrances) {
  const encumbranceRows = (encumbrances || []).map((record) => ({
    c0: record.type || "",
    c1: record.description || "",
    c2: record.date || "",
    c3: record.journalNo || "",
  }));
  state.tables.encumbrance = encumbranceRows.length
    ? encumbranceRows
    : Array.from({ length: sections.find((section) => section.id === "encumbrance")?.table?.rows || 5 }, () => ({}));

  const groupedRows = createEmptyEncumbranceReportTables();
  (encumbrances || []).forEach((record) => {
    const tableKey = getEncumbranceReportTableKey(record);
    groupedRows[tableKey].push(tableKey === "encumbranceMortgages"
      ? parseTakbisMortgageRecord(record)
      : tableKey === "encumbranceAnnotations"
        ? parseTakbisAnnotationRecord(record)
      : {
          c0: record.type || "",
          c1: record.description || "",
          c2: record.date || "",
          c3: record.journalNo || "",
        });
  });

  encumbranceReportTables.forEach((table) => {
    state.tables[table.key] = groupedRows[table.key].length
      ? groupedRows[table.key]
      : [];
  });
  refreshEncumbranceSummaryFromCurrentData();
}

function createEmptyEncumbranceReportTables() {
  return encumbranceReportTables.reduce((tables, table) => {
    tables[table.key] = [];
    return tables;
  }, {});
}

function createEmptyEncumbranceRows() {
  return Array.from({ length: encumbranceEmptyRowCount }, () => ({}));
}

function refreshEncumbranceSummaryFromCurrentFields(changedKey) {
  if (!["bank", "takbisDate", "takbisMethod", "titleRecordChange"].includes(changedKey)) return;
  refreshEncumbranceSummaryFromCurrentData();
}

function refreshEncumbranceSummaryFromCurrentData() {
  const summary = buildEncumbranceSummary();
  state.fields.takbisSummary = summary;
  const control = document.querySelector('[data-field="takbisSummary"]');
  if (control && control.value !== summary) {
    control.value = summary;
    markFieldSourceState(control, "takbisSummary", true);
  }
}

function buildEncumbranceSummary() {
  const hasRows = encumbranceReportTables.some((table) => getFilledEncumbranceRows(table.key).length);
  const hasTitleChange = Boolean(normalizeYesNoChoice(state.fields.titleRecordChange));
  if (!hasRows && !state.fields.takbisDate && !state.fields.takbisMethod && !hasTitleChange) return "";

  const date = encumbranceDateOrBila(state.fields.takbisDate);
  const method = encumbranceTextOrBila(state.fields.takbisMethod || "Webtapu Sistemi");
  const declarationRows = getFilledEncumbranceRows("encumbranceDeclarations");
  const parts = [
    `${date} tarihinde ${method} üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde aşağıdaki takyidatlar bulunmaktadır.`,
    buildEncumbranceSectionParagraph(
      "Beyanlar Bölümü",
      declarationRows.filter((row) => !isEncumbranceRightOrLiabilityRow(row)),
      (row) => formatEncumbranceDeclarationRow(row, { addIsbankManagementPlanNote: true }),
    ),
    buildEncumbranceSectionParagraph(
      "Hak ve Mükellefiyetler Bölümü",
      declarationRows.filter(isEncumbranceRightOrLiabilityRow),
      formatEncumbranceDeclarationRow,
    ),
    buildEncumbranceSectionParagraph(
      "İpotekler Bölümü",
      getFilledEncumbranceRows("encumbranceMortgages"),
      formatEncumbranceMortgageRow,
    ),
    buildEncumbranceSectionParagraph(
      "Şerhler Bölümü",
      getFilledEncumbranceRows("encumbranceAnnotations"),
      formatEncumbranceAnnotationRow,
    ),
  ];

  const titleChangeParagraph = buildEncumbranceTitleRecordChangeParagraph(date, method);
  if (titleChangeParagraph) parts.push(titleChangeParagraph);

  return normalizeEncumbranceSummaryText(parts.filter(Boolean).join("\n\n"));
}

function normalizeEncumbranceSummaryText(value) {
  return normalizeReportDescriptionText(value)
    .replace(/\b(A\.Ş\.|T\.A\.O\.|T\.A\.Ş\.|Ltd\. Şti\.)\s+Lehine\b/g, "$1 lehine");
}

function getFilledEncumbranceRows(tableKey) {
  return (state.tables[tableKey] || []).filter((row) => Object.values(row || {}).some((value) => String(value || "").trim()));
}

function isEncumbranceRightOrLiabilityRow(row) {
  const text = foldTurkish([row?.c0, row?.c1].filter(Boolean).join(" "));
  return /HAK|MUKELLEFIYET|IRTIFAK|INTIFA|SUKNA|OTURMA|UST HAKKI|GECIT HAKKI|KAYNAK HAKKI|DAIMI HAK/.test(text);
}

function buildEncumbranceSectionParagraph(title, rows, formatter) {
  const lines = rows.map(formatter).filter(Boolean);
  return `${title}:\n${lines.length ? lines.join("\n") : "Herhangi bir kayıt bulunmamaktadır."}`;
}

function isIsbankSelectedForReport() {
  const bank = foldTurkish(state.fields.bank || "");
  return bank.includes("IS BANKASI") || bank.includes("TURKIYE IS BANKASI");
}

function hasManagementPlanStatement(value = "") {
  const folded = foldTurkish(value)
    .replace(/[.\-_/\\():;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const compact = folded.replace(/\s+/g, "");
  return folded.includes("YONETIM PLANI")
    || folded.includes("YONETIM PLAN")
    || folded.includes("YONETIM PL")
    || folded.includes("YON PLAN")
    || folded.includes("YON PL")
    || /\bY\s+PLANI?\b/.test(folded)
    || /\bY\s+PLN\b/.test(folded)
    || /\bY\s+PL\b/.test(folded)
    || /\bY\s+P\b/.test(folded)
    || compact.includes("YONETIMPLANI")
    || compact.includes("YONETIMPLAN")
    || compact.includes("YONETIMPL")
    || compact.includes("YONPLAN")
    || compact.includes("YONPL")
    || compact.includes("YPLAN")
    || compact.includes("YPLANI")
    || compact.includes("YPLN")
    || compact.includes("YPL")
    || compact.includes("YP");
}

function getIsbankManagementPlanNote() {
  return "(Yönetim planı, ana taşınmazın yönetim tarzını, kullanma maksat ve şeklini, yönetici ve denetçilerin alacakları ücreti ve yönetime ait diğer hususları ve bütün kat maliklerini bağlayan sözleşme hükmündeki bir belgedir. Söz konusu beyan, taşınmazın satışını ve/veya taşınmaz üzerinde ipotek tesisi edilmesini kısıtlayıcı bir faktör oluşturmamaktadır.)";
}

function formatEncumbranceDeclarationRow(row, options = {}) {
  const type = encumbranceCleanText(row.c0);
  const description = encumbranceCleanText(row.c1);
  const mainText = description
    ? (type && !/^BEYAN|HAK|MUKELLEFIYET$/i.test(foldTurkish(type)) ? `${type}: ${description}` : description)
    : type;
  if (!mainText) return "";
  const note = options.addIsbankManagementPlanNote
    && isIsbankSelectedForReport()
    && hasManagementPlanStatement([type, description].join(" "))
    ? ` ${getIsbankManagementPlanNote()}`
    : "";
  return `${mainText} (Tarih: ${encumbranceDateOrBila(row.c2)}, Yevmiye No: ${encumbranceTextOrBila(row.c3)})${note}`;
}

function formatEncumbranceAnnotationRow(row) {
  const type = encumbranceCleanText(row.c0);
  const description = encumbranceCleanText(row.c1);
  const amount = encumbranceCleanText(row.c2);
  const detailParts = [];
  if (amount) detailParts.push(`Haciz Tutarı: ${formatEncumbranceMoney(amount)}`);
  detailParts.push(`Tarih: ${encumbranceDateOrBila(row.c3)}`);
  detailParts.push(`Yevmiye No: ${encumbranceTextOrBila(row.c4)}`);
  const mainText = [type, description].filter(Boolean).join(type && description ? ": " : "");
  if (!mainText) return "";
  return `${mainText} (${detailParts.join(", ")})`;
}

function formatEncumbranceMortgageRow(row) {
  const creditor = normalizeMortgageCreditorDisplay(row.c0) || "Bila";
  const degree = formatEncumbranceMortgageDegree(row.c1);
  const amount = formatEncumbranceMoney(row.c2);
  return `${creditor} lehine ${degree} ${amount} tutarında ipotek kaydı bulunmaktadır. (Tarih: ${encumbranceDateOrBila(row.c3)}, Yevmiye No: ${encumbranceTextOrBila(row.c4)})`;
}

function buildEncumbranceTitleRecordChangeParagraph(date, method) {
  const answer = normalizeYesNoChoice(state.fields.titleRecordChange);
  if (!answer) return "";
  const prefix = `${date} tarihinde ${method} üzerinden alınan TKGM (TAKBİS) kaydı ile tapu senedi arasında`;
  if (answer === "Hayır") {
    return `Tapu Kaydı Değişikliği:\n${prefix} herhangi bir farklılık tespit edilmemiştir.`;
  }
  const selectedLabels = (state.fields.titleChangedRecords || [])
    .map((key) => titleRecordChangeOptions.find((option) => option.key === key)?.label)
    .filter(Boolean);
  if (!selectedLabels.length) {
    return `Tapu Kaydı Değişikliği:\n${prefix} farklılık bulunduğu belirtilmiş, değişen kayıt bölümleri seçilmemiştir.`;
  }
  return `Tapu Kaydı Değişikliği:\n${prefix} farklılık olarak ${joinTurkishList(selectedLabels)} bölümlerinin değişmiş olduğu tespit edilmiştir.`;
}

function encumbranceCleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function encumbranceTextOrBila(value) {
  const text = encumbranceCleanText(value);
  return text || "Bila";
}

function encumbranceDateOrBila(value) {
  return encumbranceTextOrBila(dateIsoToTr(value));
}

function formatEncumbranceMortgageDegree(value) {
  const text = encumbranceCleanText(value).split("/")[0].replace(/\s*derece.*$/i, "").replace(/[.\s]+$/g, "");
  return text ? `${text}. dereceden` : "Bila dereceden";
}

function formatEncumbranceMoney(value) {
  const raw = encumbranceCleanText(value);
  if (!raw) return "Bila";
  const currency = raw.match(/\b(TL|YTL|USD|EUR|GBP)\b/i)?.[1]?.toUpperCase().replace("YTL", "TL") || "TL";
  const amount = parseEncumbranceMoneyNumber(raw);
  if (Number.isFinite(amount) && amount > 0) {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
  return /\b(TL|YTL|USD|EUR|GBP)\b/i.test(raw) ? raw.replace(/\bYTL\b/gi, "TL") : `${raw} ${currency}`;
}

function parseEncumbranceMoneyNumber(value) {
  const text = String(value || "").replace(/\s+/g, "").replace(/[^\d,.-]/g, "");
  if (!text) return Number.NaN;
  if (text.includes(",")) {
    return parseReportNumber(text);
  }
  const normalized = /\.\d{3}(\.|$)/.test(text)
    ? text.replace(/\./g, "")
    : text;
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
}

function getEncumbranceReportTableKey(record) {
  const type = foldTurkish(record?.type || "");
  if (/IPOTEK|REHIN/.test(type)) return "encumbranceMortgages";
  if (/SERH/.test(type)) return "encumbranceAnnotations";
  return "encumbranceDeclarations";
}

function parseTakbisAnnotationRecord(record) {
  const parsed = extractTakbisAnnotationType(record?.description || "", record?.type || "");
  const annotationType = normalizeTakbisAnnotationReportType(parsed.type, parsed.description);
  const amountSource = getTakbisAnnotationSearchSource(record, parsed.description);
  const shouldReadAmount = isTakbisLienType(annotationType) && !shouldSkipTakbisLienAmount(annotationType, amountSource);
  const lienAmount = shouldReadAmount
    ? extractTakbisLienAmount(amountSource)
    : "";
  return {
    c0: annotationType,
    c1: parsed.description,
    c2: lienAmount,
    c3: record?.date || "",
    c4: record?.journalNo || "",
    __amountSource: amountSource,
    __requiresLienAmount: shouldReadAmount ? "1" : "",
    __amountMissing: shouldReadAmount && !lienAmount ? "1" : "",
    __date: record?.date || "",
    __journalNo: record?.journalNo || "",
  };
}

function normalizeTakbisAnnotationTableRow(row) {
  if (!row || typeof row !== "object") return row;
  const annotationType = normalizeTakbisAnnotationReportType(row.c0 || "Şerh", row.c1 || "");
  row.c0 = annotationType;
  const requiresLienAmount = isTakbisLienType(annotationType)
    && !shouldSkipTakbisLienAmount(annotationType, row.__amountSource || row.c1 || "");
  row.__requiresLienAmount = requiresLienAmount ? "1" : "";
  if (requiresLienAmount && !row.c2) {
    const amountSource = getTakbisAnnotationAmountSource(row, annotationType);
    row.__amountSource = amountSource;
    row.c2 = extractTakbisLienAmount(amountSource);
  }
  row.__amountMissing = requiresLienAmount && !row.c2 ? "1" : "";
  return row;
}

function stringifyTakbisSourceValue(value) {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map(stringifyTakbisSourceValue).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value).map(stringifyTakbisSourceValue).filter(Boolean).join(" ");
  }
  return cleanTakbisValue(value);
}

function getTakbisAnnotationSearchSource(item, parsedDescription = "") {
  if (!item && !parsedDescription) return "";
  const parts = [
    item?._MergedText,
    item?.mergedText,
    item?.merged,
    item?._TAIL,
    item?.tail,
    item?.tailText,
    item?.ACIKLAMA,
    item?.aciklama,
    parsedDescription,
    item?.description,
    item?.rawText,
    item?.sourceText,
    item?.fullText,
    item?.text,
    item?._ocrText,
    item?.ocrText,
    item?.__amountSource,
    item?.__rawText,
    item?.c1,
  ].map(stringifyTakbisSourceValue).filter(Boolean);

  return [...new Set(parts)].join(" ");
}

function shouldSkipTakbisLienAmount(annotationType, sourceValue = "") {
  const folded = foldTurkish(`${annotationType || ""} ${sourceValue || ""}`);
  const compact = folded.replace(/\s+/g, "");
  return folded.includes("150/C") || compact.includes("150C") || folded.includes("SATISA GITME");
}

function getTakbisAnnotationAmountSource(row, annotationType = "") {
  const directSource = getTakbisAnnotationSearchSource(row, row?.c1 || "");

  if (extractTakbisLienAmount(directSource)) return directSource;

  const takbisRecords = state.sourceValues.takbis?.encumbrances || [];
  const rowDate = cleanTakbisValue(row?.c3 || row?.__date || "");
  const rowJournal = cleanTakbisValue(row?.c4 || row?.__journalNo || "");
  const foldedRowDescription = foldTurkish(cleanTakbisValue(row?.c1 || ""));
  const foldedAnnotationType = foldTurkish(annotationType || row?.c0 || "");
  const annotationRecords = takbisRecords
    .filter((record) => getEncumbranceReportTableKey(record) === "encumbranceAnnotations")
    .map((record) => {
      const parsed = extractTakbisAnnotationType(record?.description || "", record?.type || "");
      const source = getTakbisAnnotationSearchSource(record, parsed.description);
      const recordType = normalizeTakbisAnnotationReportType(parsed.type || record?.type || "", parsed.description || record?.description || "");
      return {
        record,
        parsed,
        source,
        recordType,
        recordDate: cleanTakbisValue(record?.date || ""),
        recordJournal: cleanTakbisValue(record?.journalNo || ""),
        foldedSource: foldTurkish(source),
      };
    });

  const candidates = annotationRecords.filter((item) => {
    const sameJournal = rowJournal && item.recordJournal === rowJournal;
    const sameDate = rowDate && item.recordDate === rowDate;
    if (sameJournal && sameDate) return true;
    if (sameJournal && !rowDate) return true;
    if (sameDate && !rowJournal) return true;
    return false;
  });

  const typeMatches = (item) => !foldedAnnotationType || foldTurkish(item.recordType) === foldedAnnotationType;
  const descriptionMatches = (item) => foldedRowDescription && item.foldedSource.includes(foldedRowDescription);
  const hasAmount = (item) => Boolean(extractTakbisLienAmount(item.source));

  const matchingRecord = candidates.find((item) => typeMatches(item) && hasAmount(item))
    || candidates.find((item) => hasAmount(item))
    || annotationRecords.find((item) => typeMatches(item) && descriptionMatches(item) && hasAmount(item))
    || annotationRecords.find((item) => typeMatches(item) && hasAmount(item))
    || annotationRecords.find((item) => descriptionMatches(item) && hasAmount(item))
    || candidates.find(typeMatches)
    || candidates[0];

  if (!matchingRecord) return directSource;
  return [
    directSource,
    matchingRecord.source,
  ].filter(Boolean).join(" ");
}

function extractTakbisAnnotationType(descriptionValue, fallbackType = "") {
  let description = cleanTakbisEncumbranceText(descriptionValue);
  let annotationType = "";

  const colonMatch = description.match(/^([^:]{2,90})\s*:\s*(.+)$/);
  if (colonMatch && isLikelyTakbisAnnotationType(colonMatch[1])) {
    annotationType = cleanTakbisAnnotationType(colonMatch[1]);
    description = colonMatch[2];
  }

  if (!annotationType) {
    const trailingParenthesis = description.match(/\(([^()]{3,140})\)\s*$/);
    if (trailingParenthesis) {
      annotationType = cleanTakbisAnnotationType(trailingParenthesis[1]);
      description = description.slice(0, trailingParenthesis.index).trim();
    }
  }

  return {
    type: toTitleCaseTr(cleanTakbisAnnotationType(annotationType || fallbackType || "\u015eerh")),
    description: cleanTakbisValue(description || descriptionValue),
  };
}

function cleanTakbisAnnotationType(value) {
  let text = cleanTakbisValue(value);
  if (/^SABLON\s*:/.test(foldTurkish(text))) {
    const colonIndex = text.indexOf(":");
    text = colonIndex >= 0 ? text.slice(colonIndex + 1) : "";
  }
  return text.replace(/\s+/g, " ").trim();
}

function normalizeTakbisAnnotationReportType(typeValue, descriptionValue = "") {
  const type = cleanTakbisAnnotationType(typeValue);
  const foldedAll = foldTurkish(`${type} ${descriptionValue}`);
  if (/KONKORDATO/.test(foldedAll)) {
    return "Konkordato \u015eerhi";
  }
  if (/(?:IIK|IIC|I\.I\.K|IICRA)\s*150\s*\/?\s*C|150\s*\/?\s*C/.test(foldedAll)) {
    return "\u0130\u0130K 150/C \u015eerhi";
  }
  if (/HACIZ/.test(foldedAll)) {
    if (/IHTIYATI/.test(foldedAll)) {
      return "\u0130htiyati Haciz";
    }
    if (/KAMU|AMME|6183|VERGI|SGK|SOSYAL\s+GUVENLIK|BELEDIYE|MALIYE|HAZINE|GUMRUK/.test(foldedAll)) {
      return "Kamu Haczi";
    }
    return "\u0130crai Haciz";
  }
  return toTitleCaseTr(type);
}

function isTakbisLienType(typeValue) {
  return /HACIZ/.test(foldTurkish(typeValue || ""));
}

function extractTakbisDebtToCurrencyAmount(value) {
  const text = cleanTakbisValue(value);
  if (!text) return "";

  const sources = [text, foldTurkish(text)];
  const debtPatterns = [
    /\bBOR\S{0,4}\s*[:;]?\s*([0-9][0-9.,\s]*[0-9])\s*(?:Y\s*)?T\s*\.?\s*L\.?\b/gi,
    /\bBOR\S{0,4}\s*[:;]?\s*([^()]{1,160}?)\s*(?:Y\s*)?T\s*\.?\s*L\.?\b/gi,
  ];

  for (const source of sources) {
    for (const pattern of debtPatterns) {
      const matches = [...source.matchAll(pattern)];
      for (let i = matches.length - 1; i >= 0; i -= 1) {
        const rawAmount = (matches[i][1] || "").replace(/[^\d.,\s]/g, " ");
        const numberMatches = rawAmount.match(/[0-9][0-9.,\s]*[0-9]|[0-9]/g) || [];
        for (let j = numberMatches.length - 1; j >= 0; j -= 1) {
          const amount = extractTakbisMoneyCandidate(numberMatches[j]);
          if (amount) return amount;
        }
      }
    }
  }

  return "";
}

function extractTakbisLienAmount(value) {
  const text = cleanTakbisValue(value);
  if (!text) return "";
  const debtToCurrencyAmount = extractTakbisDebtToCurrencyAmount(text);
  if (debtToCurrencyAmount) return debtToCurrencyAmount;

  const debtWindowAmount = extractTakbisDebtWindowAmount(text);
  if (debtWindowAmount) return debtWindowAmount;

  const leftWindowAmount = extractTakbisCurrencyLeftWindowAmount(text);
  if (leftWindowAmount) return leftWindowAmount;

  const debtLabelAmount = extractTakbisDebtLabelAmount(text);
  if (debtLabelAmount) return debtLabelAmount;

  const labeledAmount = extractTakbisLabeledLienAmount(text);
  if (labeledAmount) return labeledAmount;

  const currencyNearbyAmount = extractTakbisCurrencyNearbyAmount(text);
  if (currencyNearbyAmount) return currencyNearbyAmount;

  const powerQueryAmount = extractTakbisPowerQueryLienAmount(text);
  if (powerQueryAmount) return powerQueryAmount;

  const ileCurrencyAmount = extractTakbisIleCurrencyAmount(text);
  if (ileCurrencyAmount) return ileCurrencyAmount;

  const currencyMatches = [...text.matchAll(/(?:TL|\u20ba|TRY|T\.L\.)?\s*([0-9]{5,}(?:[.,][0-9]{1,2})?|[0-9]{1,3}(?:[.,\s][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{1,4}[.,][0-9]{2}|[0-9]+(?:[.,][0-9]{1,2})?)\s*(?:TL|\u20ba|TRY|T\.L\.)/gi)];
  if (currencyMatches.length) {
    return formatTakbisTurkishMoney(currencyMatches[currencyMatches.length - 1][1]);
  }

  const amountOnlyMatches = [...text.matchAll(/\b([0-9]{1,3}(?:[.,\s][0-9]{3})+[.,][0-9]{2}|[0-9]{5,}(?:[.,][0-9]{2})?|[0-9]{1,4}[.,][0-9]{2})\b/g)]
    .map((match) => match[1])
    .filter((candidate) => isLikelyTakbisLienAmount(candidate, text));
  if (!amountOnlyMatches.length) return "";
  return formatTakbisTurkishMoney(amountOnlyMatches[amountOnlyMatches.length - 1]);
}

function extractTakbisDebtWindowAmount(value) {
  const text = cleanTakbisValue(value);
  if (!text) return "";
  const directDebtPattern = /(?:\bbor(?:\u00e7|c)|\bBOR(?:\u00c7|C))\s*[:：]?\s*([0-9][0-9.,\s]*[0-9])\s*(?:Y\s*)?T\s*\.?\s*L\.?\b/giu;
  const directDebtMatches = [...text.matchAll(directDebtPattern)];
  for (let i = directDebtMatches.length - 1; i >= 0; i -= 1) {
    const amount = extractTakbisMoneyCandidate(directDebtMatches[i][1]);
    if (amount) return amount;
  }
  const mojibakeDebtPattern = /\bbor\u00c3\u00a7\s*[:：]?\s*([0-9][0-9.,\s]*[0-9])\s*(?:Y\s*)?T\s*\.?\s*L\.?\b/giu;
  const mojibakeDebtMatches = [...text.matchAll(mojibakeDebtPattern)];
  for (let i = mojibakeDebtMatches.length - 1; i >= 0; i -= 1) {
    const amount = extractTakbisMoneyCandidate(mojibakeDebtMatches[i][1]);
    if (amount) return amount;
  }
  const sources = [text, foldTurkish(text)];
  const debtPattern = /\bBORC\s*[:：]?\s*([0-9][0-9.,\s]*[0-9])\s*(?:Y\s*)?T\s*\.?\s*L\.?\b/gi;
  for (const source of sources) {
    const matches = [...source.matchAll(debtPattern)];
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      const amount = extractTakbisMoneyCandidate(matches[i][1]);
      if (amount) return amount;
    }
  }
  return "";
}

function extractTakbisCurrencyLeftWindowAmount(value) {
  const text = cleanTakbisValue(value);
  const currencyPattern = /(?:\bY\s*)?T\s*\.?\s*L\.?\b|\bTRY\b|\u20ba/gi;
  const currencyMatches = [...text.matchAll(currencyPattern)];
  if (!currencyMatches.length) return "";

  for (let matchIndex = currencyMatches.length - 1; matchIndex >= 0; matchIndex -= 1) {
    const currencyMatch = currencyMatches[matchIndex];
    const currencyIndex = currencyMatch.index || 0;
    const leftWindow = text.slice(Math.max(0, currencyIndex - 40), currencyIndex);
    const numericOnly = leftWindow.replace(/[^\d.,]/g, " ").replace(/\s+/g, " ").trim();
    const numberMatches = numericOnly.match(/[0-9][0-9.,]*[0-9]|[0-9]/g) || [];

    for (let i = numberMatches.length - 1; i >= 0; i -= 1) {
      const candidate = numberMatches[i].replace(/[^\d.,]/g, "");
      const amount = extractTakbisMoneyCandidate(candidate);
      if (amount) return amount;
    }
  }

  return "";
}

function extractTakbisMoneyCandidate(value) {
  const cleaned = String(value || "").replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return "";
  if (/^\d{1,2}[.,]\d{1,2}[.,]\d{4}$/.test(cleaned)) return "";
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 4) return "";
  if (/^[12]\d{3}$/.test(digits)) return "";
  return formatTakbisTurkishMoney(cleaned);
}

function extractTakbisLabeledLienAmount(value) {
  const text = cleanTakbisValue(value);
  const foldedText = foldTurkish(text);
  const moneyPattern = "([0-9]{5,}(?:[.,][0-9]{1,2})?|[0-9]{1,3}(?:[.,\\s][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{1,4}[.,][0-9]{2})";
  const labelRegex = new RegExp(
    `(?:HACIZ\\s+(?:TUTARI?|MIKTARI?|BEDELI?)|ALACAK\\s+(?:TUTARI?|MIKTARI?|BEDELI?)|BORC(?:\\s+(?:TUTARI?|MIKTARI?|BEDELI?))?)[^0-9]{0,50}${moneyPattern}`
  );
  const match = foldedText.match(labelRegex);
  if (!match || !isLikelyTakbisLienAmount(match[1], foldedText)) return "";
  return formatTakbisTurkishMoney(match[1]);
}

function extractTakbisDebtLabelAmountLegacy(value) {
  const text = cleanTakbisValue(value);
  const directDebtMatch = text.match(/(?:bor[çc]|borc)\s*:?\s*([0-9][0-9.,\s]*[0-9])\s*(?:YTL|TL|TRY|T\.L\.|\u20ba)\b/i);
  if (directDebtMatch && isLikelyTakbisLienAmount(directDebtMatch[1], text)) {
    return formatTakbisTurkishMoney(directDebtMatch[1]);
  }

  const debtMatch = text.match(/(?:bor[çc]|borc)\s*:?\s*([^()]{1,160}?\b(?:YTL|TL|TRY|T\.L\.)\b)/i);
  if (!debtMatch) return "";
  const numberMatch = debtMatch[1].match(/[0-9][0-9.,\s]*[0-9]/);
  if (!numberMatch) return "";
  const cleaned = numberMatch[0].replace(/[^\d.,]/g, "");
  if (!isLikelyTakbisLienAmount(cleaned, text)) return "";
  return formatTakbisTurkishMoney(cleaned);
}

function extractTakbisCurrencyNearbyAmount(value) {
  const text = cleanTakbisValue(value);
  if (!/\bY?TL\b|\u20ba|TRY|T\.L\./i.test(text)) return "";
  const amountPattern = /[0-9][0-9.,\s]*[0-9]/g;
  const candidates = [];
  for (const currencyMatch of text.matchAll(/\bY?TL\b|\u20ba|TRY|T\.L\./gi)) {
    const currencyIndex = currencyMatch.index || 0;
    const windowStart = Math.max(0, currencyIndex - 80);
    const windowEnd = Math.min(text.length, currencyIndex + 80);
    const windowText = text.slice(windowStart, windowEnd);
    for (const amountMatch of windowText.matchAll(amountPattern)) {
      const cleaned = amountMatch[0].replace(/[^\d.,]/g, "");
      if (!isLikelyTakbisLienAmount(cleaned, text)) continue;
      const absoluteIndex = windowStart + (amountMatch.index || 0);
      candidates.push({
        value: cleaned,
        distance: Math.abs(currencyIndex - absoluteIndex),
      });
    }
  }
  if (!candidates.length) return "";
  candidates.sort((a, b) => a.distance - b.distance);
  return formatTakbisTurkishMoney(candidates[0].value);
}

function extractTakbisIleCurrencyAmount(value) {
  const text = cleanTakbisValue(value);
  if (!/\bY?TL\b|\u20ba|TRY|T\.L\./i.test(text)) return "";
  const foldedText = foldTurkish(text);
  const moneyPattern = /[0-9][0-9.,\s]*[0-9]/g;

  for (const currencyMatch of foldedText.matchAll(/\bY?TL\b|\u20ba|TRY|T\.L\./gi)) {
    const currencyIndex = currencyMatch.index || 0;
    const prefixStart = Math.max(0, currencyIndex - 320);
    const foldedPrefix = foldedText.slice(prefixStart, currencyIndex);
    const ileMatchIndex = Math.max(foldedPrefix.lastIndexOf(" ILE "), foldedPrefix.lastIndexOf(".ILE "), foldedPrefix.lastIndexOf(" ILE."));
    if (ileMatchIndex < 0) continue;

    const originalSegment = text.slice(prefixStart + ileMatchIndex, currencyIndex);
    const candidates = [...originalSegment.matchAll(moneyPattern)]
      .map((match) => match[0].replace(/[^\d.,]/g, ""))
      .filter((candidate) => isLikelyTakbisLienAmount(candidate, text));
    if (!candidates.length) continue;
    return formatTakbisTurkishMoney(candidates[candidates.length - 1]);
  }

  return "";
}

function formatTakbisTurkishMoney(rawValue) {
  const text = String(rawValue || "").replace(/\s+/g, "").trim();
  if (!text) return "";
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const separator = lastComma > lastDot ? "," : lastDot >= 0 ? "." : "";
  let integerPart = text.replace(/[^\d]/g, "");
  let decimalPart = "00";

  if (separator) {
    const separatorIndex = text.lastIndexOf(separator);
    const suffixDigits = text.slice(separatorIndex + 1).replace(/[^\d]/g, "");
    if (suffixDigits.length > 0 && suffixDigits.length !== 3) {
      integerPart = text.slice(0, separatorIndex).replace(/[^\d]/g, "");
      decimalPart = suffixDigits.padEnd(2, "0").slice(0, 2);
    }
  }

  if (!integerPart) return "";
  return `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimalPart} TL`;
}

function isLikelyTakbisLienAmount(value, sourceText = "") {
  const cleaned = String(value || "").replace(/\s+/g, "").trim();
  if (!cleaned) return false;
  if (/^\d{1,2}[.,]\d{1,2}[.,]\d{4}$/.test(cleaned)) return false;
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 5) return false;
  if (/^\d{3,8}$/.test(cleaned)) {
    const foldedSource = foldTurkish(sourceText);
    const valueIndex = foldedSource.indexOf(cleaned);
    const beforeValue = valueIndex >= 0 ? foldedSource.slice(Math.max(0, valueIndex - 35), valueIndex) : "";
    if (/YEVMIYE|YEVM|TARIH|SAYI\s*NO/.test(beforeValue) || /-\s*$/.test(beforeValue)) return false;
  }
  if (/^[12]\d{3}$/.test(cleaned)) return false;
  return /[.,]\d{2}$/.test(cleaned) || digits.length >= 5;
}

function isTakbisDebtLabelAmount(value) {
  const cleaned = String(value || "").replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return false;
  if (/^\d{1,2}[.,]\d{1,2}[.,]\d{4}$/.test(cleaned)) return false;
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 4) return false;
  if (/^[12]\d{3}$/.test(digits)) return false;
  return true;
}

function extractTakbisDebtLabelAmount(value) {
  const text = cleanTakbisValue(value);
  const sources = [text, foldTurkish(text)];
  const foldedText = foldTurkish(text);
  const explicitDebtMatches = [...foldedText.matchAll(/\bBORC\s*:?\s*([0-9][0-9.,\s]*[0-9])\s*(?:YTL|TL|TRY|T\.L\.|\u20ba)\b/gi)];
  for (let i = explicitDebtMatches.length - 1; i >= 0; i -= 1) {
    const amount = explicitDebtMatches[i][1];
    if (isTakbisDebtLabelAmount(amount)) {
      return formatTakbisTurkishMoney(amount);
    }
  }

  for (const source of sources) {
    const directDebtMatch = source.match(/(?:BORC|bor[çc]|borc)\s*:?\s*([0-9][0-9.,\s]*[0-9])\s*(?:YTL|TL|TRY|T\.L\.|\u20ba)\b/i);
    if (directDebtMatch && isLikelyTakbisLienAmount(directDebtMatch[1], source)) {
      return formatTakbisTurkishMoney(directDebtMatch[1]);
    }
  }

  for (const source of sources) {
    const debtMatch = source.match(/(?:BORC|bor[çc]|borc)\s*:?\s*([^()]{1,220}?\b(?:YTL|TL|TRY|T\.L\.)\b)/i);
    if (!debtMatch) continue;
    const numberMatch = debtMatch[1].match(/[0-9][0-9.,\s]*[0-9]/);
    if (!numberMatch) continue;
    const cleaned = numberMatch[0].replace(/[^\d.,]/g, "");
    if (!isLikelyTakbisLienAmount(cleaned, source)) continue;
    return formatTakbisTurkishMoney(cleaned);
  }

  return "";
}

function extractTakbisPowerQueryLienAmount(value) {
  const text = cleanTakbisValue(value);
  if (!/\bY?TL\b|\u20ba|TRY|T\.L\./i.test(text)) return "";
  const pieces = getTakbisNumericPieces(text)
    .map((piece) => ({
      raw: piece,
      number: parseTakbisSmartNumber(piece),
      hasDecimal: hasTakbisDecimalPart(piece),
    }))
    .filter((piece) => piece.number !== null && piece.number >= 1 && isLikelyTakbisLienAmount(piece.raw, text));

  if (!pieces.length) return "";
  const decimalPieces = pieces.filter((piece) => piece.hasDecimal);
  const candidates = decimalPieces.length ? decimalPieces : pieces;
  candidates.sort((a, b) => b.number - a.number);
  return formatTakbisTurkishMoney(candidates[0].raw);
}

function getTakbisNumericPieces(value) {
  const text = String(value || "");
  const matches = text.match(/[0-9][0-9.,]*/g) || [];
  return matches
    .map((piece) => piece.replace(/^[.,]+|[.,]+$/g, ""))
    .filter((piece) => /\d/.test(piece));
}

function hasTakbisDecimalPart(value) {
  const text = String(value || "").replace(/^[.,]+|[.,]+$/g, "");
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const index = Math.max(lastComma, lastDot);
  if (index < 0) return false;
  return /^\d{2}$/.test(text.slice(index + 1).replace(/\D/g, ""));
}

function parseTakbisSmartNumber(value) {
  let text = String(value || "").replace(/\s+/g, "").replace(/^[.,]+|[.,]+$/g, "");
  if (!text) return null;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const separatorIndex = Math.max(lastComma, lastDot);
  if (separatorIndex >= 0) {
    const suffix = text.slice(separatorIndex + 1).replace(/\D/g, "");
    if (suffix.length === 2) {
      const integerPart = text.slice(0, separatorIndex).replace(/\D/g, "");
      const normalized = `${integerPart}.${suffix}`;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  text = text.replace(/\D/g, "");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function isLikelyTakbisAnnotationType(value) {
  const text = cleanTakbisValue(value);
  const folded = foldTurkish(text);
  if (!text || text.length > 90) return false;
  if (/\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}/.test(text)) return false;
  if (/^(NILUFER|OSMANGAZI|MUDANYA|BURSA|ISTANBUL|TARIH|YEVMIYE|TESIS|TERKIN)\b/.test(folded)) return false;
  return /HACIZ|IFLAS|AILE|KONUT|KAT|YONETIM|IPOTEK|REHIN|INTIFA|IRTIFAK|SATIS|KAMULASTIRMA|MUVAFAKAT|TEDBIR|DAVALI|150\s*\/?\s*C|MD\.?|MADDE/.test(folded)
    || text.split(/\s+/).length <= 5;
}

function parseTakbisMortgageRecord(record) {
  const rawDescription = cleanTakbisEncumbranceText(record?.description || "");
  const rawText = cleanTakbisEncumbranceText(record?.rawText || "");
  const sourceText = rawText || rawDescription;
  const mainDescription = sliceBeforeFolded(
    sourceText,
    /REHINE\s+AIT\s+SERH|150\s*\/?\s*C|^\s*SERH\b|IPOTEGIN\s+KONULDUGU|HISSE\s+BILGISI|BORCLU\s+MALIK|MALIK\s+BORC|TESCIL\s+TARIH/,
  );
  const amountInfo = extractTakbisMortgageAmount(mainDescription);
  const degreeMatch = mainDescription.match(/\b\d+\s*\/\s*\d+\b/);
  const fallbackDateInfo = extractTakbisEncumbranceDateInfo(sourceText || mainDescription);
  const cutIndexes = [];
  const firstCut = cutIndexes.length ? Math.min(...cutIndexes) : mainDescription.length;
  let creditor = extractTakbisMortgageCreditor(mainDescription, amountInfo.raw);
  const debtorFlagMatch = creditor.match(/\b(?:Evet|Hayır|Hayir)\b/i);
  if (debtorFlagMatch) creditor = creditor.slice(0, debtorFlagMatch.index);

  const parsedCreditor = toTitleCaseTakbisEntity(cleanTakbisMortgageCreditorTokens(cleanTakbisMortgageCreditor(creditor)));

  return {
    c0: chooseKnownMortgageCreditor(parsedCreditor),
    c1: degreeMatch ? degreeMatch[0].split("/")[0].trim() : "",
    c2: amountInfo.text,
    c3: record?.date || fallbackDateInfo.date || "",
    c4: record?.journalNo || fallbackDateInfo.journalNo || "",
  };
}

function sliceBeforeFolded(value, pattern) {
  const text = String(value || "");
  const folded = foldTurkish(text);
  const match = folded.match(pattern);
  return match ? text.slice(0, match.index).trim() : text.trim();
}

function extractTakbisMortgageCreditor(value, amountRaw = "") {
  let text = cleanTakbisValue(value);
  const vknMatch = text.match(/\bVKN\s*:?\s*\d+\b/i);
  if (vknMatch) {
    text = text.slice(0, vknMatch.index);
  }
  if (amountRaw) {
    text = text.replace(new RegExp(escapeRegExp(amountRaw), "i"), " ");
  }
  return text
    .replace(/\(\s*SN\s*:\s*\d+\s*\)/gi, " ")
    .replace(/\b(?:Alacakl[ıi]|Alacakli|Müşterek|Musterek|Bor[çc]|Mi\?|Evet|Hayır|Hayir|faizsiz|F\.?B\.?K\.?)\b/gi, " ")
    .replace(/\b\d+\s*\/\s*\d+\b/g, " ")
    .replace(/\b\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}(?:\s+\d{1,2}:\d{2})?\b/g, " ")
    .replace(/\b\d{3,8}\b\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTakbisMortgageAmount(value) {
  const text = cleanTakbisValue(value)
    .replace(/[₺]/g, " TL ")
    .replace(/[€]/g, " EUR ")
    .replace(/[$]/g, " USD ")
    .replace(/\s+/g, " ")
    .trim();
  const splitDecimal = text.match(/\b\d+(?:[.,]\d{3})*\s+00\s*(?:TL|TRY|T\.L\.|USD|EUR|GBP|CHF)\b/i);
  if (splitDecimal) {
    return {
      raw: splitDecimal[0],
      text: normalizeTakbisMortgageAmountEnhanced(splitDecimal[0].replace(/\s+00\s+/i, ",00 ")),
    };
  }
  const amountWithCurrency = text.match(/\b\d+(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:TL|TRY|T\.L\.|USD|EUR|GBP|CHF)\b/i);
  if (amountWithCurrency) {
    return {
      raw: amountWithCurrency[0],
      text: normalizeTakbisMortgageAmountEnhanced(amountWithCurrency[0]),
    };
  }
  const amountOnly = text.match(/\b\d{5,}(?:[.,]\d{2})?\b/);
  return amountOnly
    ? { raw: amountOnly[0], text: normalizeTakbisMortgageAmountEnhanced(amountOnly[0]) }
    : { raw: "", text: "" };
}

function normalizeTakbisMortgageAmountEnhanced(value) {
  const text = cleanTakbisValue(value)
    .replace(/\bTRY\b|T\.L\./gi, "TL")
    .replace(/\s+/g, " ")
    .trim();
  const match = text.match(/^(.+?)(?:\s+(TL|USD|EUR|GBP|CHF))?$/i);
  if (!match) return text;
  const currency = match[2] ? match[2].toUpperCase() : "";
  const numeric = match[1].replace(/\s/g, "");
  const decimalMatch = numeric.match(/^(.*)([.,])(\d{2})$/);
  let integerPart = numeric;
  let decimalPart = "";
  if (decimalMatch) {
    integerPart = decimalMatch[1];
    decimalPart = decimalMatch[3];
  }
  const digits = integerPart.replace(/\D/g, "");
  if (!digits) return text;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return [decimalPart ? `${grouped},${decimalPart}` : grouped, currency].filter(Boolean).join(" ").trim();
}

function normalizeMortgageBankCompare(value) {
  return foldTurkish(value)
    .replace(/\b(?:A\s*S|AS|T\s*A\s*O|TAO|T\s*A\s*S|TAS)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chooseKnownMortgageCreditor(value) {
  const cleaned = cleanTakbisValue(value);
  const source = normalizeMortgageBankCompare(cleaned);
  if (!source) return cleaned;

  let best = { name: cleaned, score: 0 };
  mortgageCreditorBankNames.forEach((bankName) => {
    const target = normalizeMortgageBankCompare(bankName);
    const score = scoreMortgageBankMatch(source, target);
    if (score > best.score) {
      best = { name: bankName, score };
    }
  });

  return best.score >= 24 ? best.name : cleaned;
}

function normalizeMortgageCreditorDisplay(value) {
  const cleaned = cleanTakbisValue(value);
  if (!cleaned) return "";
  const known = chooseKnownMortgageCreditor(cleaned);
  if (mortgageCreditorBankNames.includes(known)) return known;
  return preserveMortgageCreditorAbbreviations(normalizeReportTitleText(cleaned));
}

function preserveMortgageCreditorAbbreviations(value) {
  return String(value || "")
    .replace(/\bA\.?\s*Ş\.?/gi, "A.Ş.")
    .replace(/\bT\.?\s*A\.?\s*O\.?/gi, "T.A.O.")
    .replace(/\bT\.?\s*A\.?\s*Ş\.?/gi, "T.A.Ş.")
    .replace(/\bA\.?\s*S\.?/gi, "A.Ş.")
    .replace(/\bT\.?\s*A\.?\s*S\.?/gi, "T.A.Ş.")
    .replace(/\bLtd\.?\s*Şti\.?/gi, "Ltd. Şti.")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMortgageBankMatch(source, target) {
  if (!source || !target) return 0;
  if (source.includes(target)) return 120;
  const sourceTokens = new Set(source.split(" ").filter(Boolean));
  const targetTokens = target.split(" ").filter(Boolean);
  const genericTokens = new Set(["TURKIYE", "BANK", "BANKASI", "KATILIM", "KREDI", "YATIRIM", "VE"]);
  let score = 0;
  let distinctive = false;

  targetTokens.forEach((token) => {
    if (!token) return;
    const matched = sourceTokens.has(token) || source.includes(token);
    if (!matched) return;
    score += token.length >= 5 ? 12 : 5;
    if (!genericTokens.has(token) && token.length >= 3) distinctive = true;
  });

  return distinctive ? score : 0;
}

function cleanTakbisMortgageCreditor(value) {
  return cleanTakbisValue(value)
    .replace(/\(\s*SN\s*:\s*\d+\s*\)/gi, "")
    .replace(/\b(?:Alacakl[ıi]|M[üu]şterek\s+Mi|Bor[çc]|Faiz|Derece\s*S[ıi]ra|S[üu]re)\b/gi, "")
    .replace(/\b(?:Evet|Hayır|Hayir)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTakbisMortgageCreditorTokens(value) {
  const noise = new Set([
    "ALACAKLI",
    "MUSTEREK",
    "BORC",
    "MI",
    "EVET",
    "HAYIR",
    "FAIZSIZ",
    "FBK",
    "IPOTEK",
    "DERECE",
    "TESIS",
    "TARIH",
    "YEV",
    "YEVMIYE",
    "SIRA",
    "SURE",
    "YILLIK",
  ]);
  return cleanTakbisValue(value)
    .replace(/\bY[ıiIİ]ll[ıiIİ]k\s*%?\s*\d+(?:[.,]\d+)?\b/gi, " ")
    .replace(/%\s*\d+(?:[.,]\d+)?/g, " ")
    .replace(/\b\d+\s*\/\s*\d+\b/g, " ")
    .replace(/\b\d{1,2}[-.\/]\d{1,2}[-.\/]\d{4}(?:\s+\d{1,2}:\d{2})?\b/g, " ")
    .split(/\s+/)
    .filter((token) => {
      const folded = foldTurkish(token).replace(/[^A-Z0-9]/g, "");
      if (!folded) return false;
      if (noise.has(folded)) return false;
      if (/^YILLIK\d*$/.test(folded)) return false;
      if (/^\d+$/.test(folded)) return false;
      return true;
    })
    .join(" ")
    .replace(/\b(Katılım|Katilim)\s+\S+\s+(Bankas[ıi])\b/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTakbisMortgageAmount(value) {
  return cleanTakbisValue(value)
    .replace(/\s*(?:TRY|T\.L\.)\b/i, " TL")
    .replace(/\s+/g, " ")
    .trim();
}

function resetTakbisTitleDerivedFields() {
  [
    "takbisReportDate",
    "takbisReportTime",
    "groundType",
    "titleQuality",
    "titlePropertyId",
    "titleCity",
    "titleDistrict",
    "titleNeighborhood",
    "locationName",
    "blockNo",
    "parcelNo",
    "titleBlockName",
    "titleFloor",
    "unitNo",
    "share",
    "denominator",
    "landArea",
    "registryVolume",
    "registryPage",
    "mainPropertyQuality",
    "titleDate",
    "journalNo",
    "titleOwnershipKind",
    "addressBlockName",
    "takbisDate",
    "takbisTime",
    "takbisMethod",
    "takbisSummary",
  ].forEach((key) => {
    const currentValue = state.fields[key] || "";
    const previousSourceValue = state.sourceValues.takbis?.applied?.[key] || "";
    if (!currentValue || currentValue === previousSourceValue) {
      state.fields[key] = "";
    }
  });
  state.tables.title = Array.from({ length: sections.find((section) => section.id === "title")?.table?.rows || 3 }, () => ({}));
  state.tables.encumbrance = Array.from({ length: sections.find((section) => section.id === "encumbrance")?.table?.rows || 5 }, () => ({}));
  encumbranceReportTables.forEach((table) => {
    state.tables[table.key] = [];
  });
  state.sourceValues.takbis = {};
  state.sourceConflicts.takbis = {};
}

function applyEkbFieldsToReport(options = {}) {
  const fields = state.sourceValues.ekb?.fields || {};
  state.sourceConflicts.ekb = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (!value) return;
    setFieldFromSource("ekb", key, value, options);
  });
}

function resetEkbDerivedFields() {
  [
    "ekbDocumentNo",
    "ekbIssueDate",
    "ekbValidUntil",
    "ekbEnergyClass",
    "ekbEmissionClass",
  ].forEach((key) => {
    state.fields[key] = "";
  });
  state.fields.hasEkb = "";
  state.sourceValues.ekb = {};
  state.sourceConflicts.ekb = {};
}

function applyImarFieldsToReport(options = {}) {
  const fields = state.sourceValues.imar?.fields || {};
  state.sourceConflicts.imar = {};

  const mapped = {
    imarInfoInstitution: fields.bilgiAlinanKurum,
    planName: fields.planAdi,
    planScale: fields.planOlcegi,
    planDate: dateTrToIso(fields.planTarihi) || fields.planTarihi,
    legend: fields.planFonk,
    order: fields.insaatNizami,
    taks: fields.taks,
    kaks: fields.kaks,
    hmax: fields.binaYuksekligi,
    floorCount: fields.katAdedi,
    frontGarden: fields.onBahce,
    sideGarden: fields.yanBahce,
    roadSetback: normalizeYesNoChoice(fields.yolaTerk),
    planRestrictionNote: fields.planRestrictionNote,
    planningNote: buildImarPlanningNote(fields),
    calculatedEmsal: buildImarCalculatedEmsal(fields),
  };

  Object.entries(mapped).forEach(([key, value]) => {
    if (!value) return;
    setFieldFromSource("imar", key, value, key === "planningNote" ? { ...options, force: true } : options);
  });
}

function resetImarDerivedFields() {
  [
    "imarInfoInstitution",
    "planName",
    "planScale",
    "planDate",
    "legend",
    "order",
    "taks",
    "kaks",
    "hmax",
    "floorCount",
    "frontGarden",
    "sideGarden",
    "roadSetback",
    "roadSetbackAmount",
    "roadSetbackBuildingImpact",
    "minimumFrontageCondition",
    "minimumFrontageConditionNote",
    "tevhidCondition",
    "tevhidConditionNote",
    "article18Applied",
    "article18AppliedNote",
    "urbanTransformationArea",
    "urbanTransformationAreaNote",
    "licenseObstacle",
    "licenseObstacleNote",
    "planRestrictionNote",
    "planningNote",
    "calculatedEmsal",
  ].forEach((key) => {
    const currentValue = state.fields[key] || "";
    const previousSourceValue = state.sourceValues.imar?.applied?.[key] || "";
    if (!currentValue || currentValue === previousSourceValue) {
      state.fields[key] = "";
    }
  });
  state.sourceValues.imar = {};
  state.sourceConflicts.imar = {};
}

function buildImarPlanningNote(fields = {}) {
  const current = state.fields || {};
  const data = {
    infoInstitution: firstFilled(fields.bilgiAlinanKurum, current.imarInfoInstitution),
    inspectionDate: firstFilled(dateIsoToTr(current.municipalityInspectionDate), current.municipalityInspectionDate),
    planScale: firstFilled(fields.planOlcegi, current.planScale),
    planDate: firstFilled(fields.planTarihi, dateIsoToTr(current.planDate)),
    planName: firstFilled(fields.planAdi, current.planName),
    order: firstFilled(fields.insaatNizami, current.order),
    legend: firstFilled(fields.planFonk, current.legend),
    roadSetback: normalizeYesNoChoice(firstFilled(fields.yolaTerk, current.roadSetback)),
    roadSetbackAmount: firstFilled(fields.terkMiktari, current.roadSetbackAmount),
    roadSetbackBuildingImpact: normalizeYesNoChoice(firstFilled(fields.yapidanEtkilenme, current.roadSetbackBuildingImpact)),
    hmax: firstFilled(fields.binaYuksekligi, current.hmax),
    floorCount: firstFilled(fields.katAdedi, current.floorCount),
    taks: firstFilled(fields.taks, current.taks),
    kaks: firstFilled(fields.kaks, current.kaks),
    frontGarden: firstFilled(fields.onBahce, current.frontGarden),
    sideGarden: firstFilled(fields.yanBahce, current.sideGarden),
    backGarden: firstFilled(fields.arkaBahce, current.backGarden),
    minimumFrontageCondition: normalizeYesNoChoice(current.minimumFrontageCondition),
    minimumFrontageConditionNote: current.minimumFrontageConditionNote || "",
    tevhidCondition: normalizeYesNoChoice(current.tevhidCondition),
    tevhidConditionNote: current.tevhidConditionNote || "",
    article18Applied: normalizeYesNoChoice(current.article18Applied),
    article18AppliedNote: current.article18AppliedNote || "",
    urbanTransformationArea: normalizeYesNoChoice(current.urbanTransformationArea),
    urbanTransformationAreaNote: current.urbanTransformationAreaNote || "",
    licenseObstacle: normalizeYesNoChoice(current.licenseObstacle),
    licenseObstacleNote: current.licenseObstacleNote || "",
    planRestrictionNote: firstFilled(fields.planRestrictionNote, current.planRestrictionNote),
    planCancellationStay: normalizeYesNoChoice(current.planCancellationStay),
    planCancellationStayNote: current.planCancellationStayNote || "",
    hasPlanningIssue: normalizeYesNoChoice(current.hasPlanningIssue),
    netParcelArea: firstFilled(fields.netParselAlan, current.landArea),
  };

  const hasPlanningIssue = data.hasPlanningIssue === "Evet";
  const useDetailedStatus = isKuveytTurkSelectedForPlanning();
  if (!hasPlanningIssue) {
    Object.assign(data, {
      planCancellationStay: "Hayır",
      roadSetback: "Hayır",
      minimumFrontageCondition: "Hayır",
      tevhidCondition: "Hayır",
      article18Applied: "Evet",
      urbanTransformationArea: "Hayır",
      licenseObstacle: "Hayır",
      roadSetbackAmount: "",
      roadSetbackBuildingImpact: "",
    });
    data.planRestrictionNote = "";
    if (!useDetailedStatus) {
      data.planCancellationStayNote = "";
      data.minimumFrontageConditionNote = "";
      data.tevhidConditionNote = "";
      data.article18AppliedNote = "";
      data.urbanTransformationAreaNote = "";
      data.licenseObstacleNote = "";
    }
  }

  const planCancelled = data.planCancellationStay === "Evet";
  const parts = [];
  const sourcePrefix = composeImarInfoSourcePrefix(data);

  if (planCancelled) {
    let cancelledText = `${sourcePrefix || "Konu taşınmazın "}yer aldığı imar planında iptal/yürütmeyi durdurma kararı bulunmaktadır.`;
    if (data.planCancellationStayNote) cancelledText += ` (${data.planCancellationStayNote})`;
    if (data.planRestrictionNote) cancelledText += ` ${data.planRestrictionNote}`;
    const conditions = composeImarConditionList(data);
    if (conditions.length) {
      cancelledText += ` Belediyeden alınan bilgiye göre plan iptali öncesindeki yapılaşma koşullarının ${conditions.join(", ")} şeklinde olduğu bilgisi alınmıştır.`;
    }
    parts.push(cancelledText);
  } else {
    const introBits = [];
    if (data.planDate) introBits.push(`${data.planDate} tarihli`);
    if (data.planScale) introBits.push(`${data.planScale} ölçekli`);
    if (data.planName) introBits.push(data.planName);

    let mainText = `${sourcePrefix || "Konu taşınmazın "}yer aldığı parsel`;
    if (introBits.length) mainText += `, ${introBits.join(" ")} kapsamında`;
    mainText += data.legend
      ? ` ${data.legend} alanında yer almakta olup`
      : " imar planı kapsamında değerlendirilmekte olup";
    const conditions = composeImarConditionList(data);
    mainText += conditions.length ? `, ${conditions.join(", ")} yapılaşma koşullarına sahiptir.` : ".";
    parts.push(mainText);

    const roadSetbackText = hasPlanningIssue || useDetailedStatus
      ? composeImarRoadSetbackSentence(data)
      : "";
    if (roadSetbackText) parts.push(roadSetbackText);
    if (data.planRestrictionNote) parts.push(data.planRestrictionNote);
  }

  parts.push(...composeImarPlanningStatusParagraphs(data));

  return normalizeReportDescriptionText(parts.filter(Boolean).join("\n\n"));
}

function buildImarCalculatedEmsal(fields = {}) {
  const current = state.fields || {};
  return composeImarCalculatedEmsal({
    netParcelArea: firstFilled(fields.netParselAlan, current.landArea),
    kaks: firstFilled(fields.kaks, current.kaks),
    floorCount: firstFilled(fields.katAdedi, current.floorCount),
    planCancellationStay: normalizeYesNoChoice(firstFilled(fields.planCancellationStay, current.planCancellationStay)),
  });
}

function firstFilled(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function composeImarInfoSourcePrefix(data) {
  const date = data.inspectionDate ? dateIsoToTr(data.inspectionDate) : "";
  const institution = formatImarInstitutionSource(data.infoInstitution);
  if (date && institution) return `${date} tarihinde ${institution} alınan bilgiye göre konu taşınmazın `;
  if (date) return `${date} tarihinde alınan bilgiye göre konu taşınmazın `;
  if (institution) return `${institution} alınan bilgiye göre konu taşınmazın `;
  return "";
}

function formatImarInstitutionSource(value) {
  const institution = normalizeReportTitleText(value || "").trim();
  if (!institution) return "";
  if (/Belediyesi$/i.test(institution)) return institution.replace(/Belediyesi$/i, "Belediyesinden");
  if (/Müdürlüğü$/i.test(institution)) return institution.replace(/Müdürlüğü$/i, "Müdürlüğünden");
  if (/İdaresi$/i.test(institution)) return institution.replace(/İdaresi$/i, "İdaresinden");
  return `${institution} kurumundan`;
}

function composeImarConditionList(data) {
  return [
    data.order ? `${data.order} nizam` : "",
    data.floorCount ? formatImarFloorCount(data.floorCount) : "",
    data.hmax ? `Hmax: ${formatImarMeasurement(data.hmax)}` : "",
    data.taks ? `TAKS: ${formatImarDecimal(data.taks)}` : "",
    data.kaks ? `KAKS/Emsal: ${formatImarDecimal(data.kaks)}` : "",
    data.frontGarden ? `Ön Bahçe: ${formatImarMeasurement(data.frontGarden)}` : "",
    data.sideGarden ? `Yan Bahçe: ${formatImarMeasurement(data.sideGarden)}` : "",
    data.backGarden ? `Arka Bahçe: ${formatImarMeasurement(data.backGarden)}` : "",
  ].filter(Boolean);
}

function formatImarFloorCount(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/kat/i.test(text)) return text;
  const number = parseReportNumber(text);
  if (Number.isFinite(number)) return `${number.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} kat`;
  return `Kat Adedi: ${text}`;
}

function formatImarMeasurement(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/serbest/i.test(text)) return normalizeReportTitleText(text);
  const number = parseReportNumber(text);
  if (!Number.isFinite(number)) return text;
  return `${number.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
}

function formatImarDecimal(value) {
  const text = String(value || "").trim();
  const number = parseReportNumber(text);
  if (!Number.isFinite(number)) return text;
  return number.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function composeImarRoadSetbackSentence(data) {
  if (data.roadSetback === "Evet") {
    const amount = data.roadSetbackAmount ? ` yaklaşık ${formatImarSquareMeter(data.roadSetbackAmount)}` : "";
    const impact = data.roadSetbackBuildingImpact === "Evet"
      ? " Söz konusu terkin yapıya etkisi bulunmaktadır."
      : data.roadSetbackBuildingImpact === "Hayır"
        ? " Söz konusu terkin yapıya etkisi bulunmamaktadır."
        : "";
    return `Taşınmazın yer aldığı parselin yola/parka${amount} terki bulunmaktadır.${impact}`;
  }
  if (data.roadSetback === "Hayır") {
    return "Taşınmazın yer aldığı parselin yola/parka terki bulunmamaktadır.";
  }
  return "";
}

function composeImarPlanningStatusParagraphs(data) {
  const paragraphs = [];
  const includeFallback = data.hasPlanningIssue === "Evet" || isKuveytTurkSelectedForPlanning();
  if (data.minimumFrontageCondition) {
    const paragraph = composeImarStatusParagraph(
      "Minimum Cephe Şartı",
      data.minimumFrontageConditionNote,
      `Minimum cephe şartı ${data.minimumFrontageCondition === "Evet" ? "bulunmaktadır." : "bulunmamaktadır."}`,
      includeFallback
    );
    if (paragraph) paragraphs.push(paragraph);
  }
  if (data.article18Applied) {
    const paragraph = composeImarStatusParagraph(
      "18. Madde Uygulaması",
      data.article18AppliedNote,
      `18. Madde uygulaması ${data.article18Applied === "Evet" ? "yapılmıştır." : "yapılmamıştır."}`,
      includeFallback
    );
    if (paragraph) paragraphs.push(paragraph);
  }
  if (data.tevhidCondition) {
    const paragraph = composeImarStatusParagraph(
      "Tevhid Şartı",
      data.tevhidConditionNote,
      `Tevhid şartı ${data.tevhidCondition === "Evet" ? "bulunmaktadır." : "bulunmamaktadır."}`,
      includeFallback
    );
    if (paragraph) paragraphs.push(paragraph);
  }
  if (data.urbanTransformationArea) {
    const paragraph = composeImarStatusParagraph(
      "Kentsel Dönüşüm",
      data.urbanTransformationAreaNote,
      `Taşınmaz ${data.urbanTransformationArea === "Evet" ? "kentsel dönüşüm/yenileme alanında yer almaktadır." : "kentsel dönüşüm/yenileme alanında yer almamaktadır."}`,
      includeFallback
    );
    if (paragraph) paragraphs.push(paragraph);
  }
  if (data.licenseObstacle) {
    const paragraph = composeImarStatusParagraph(
      "Ruhsat Durumu",
      data.licenseObstacleNote,
      `Ruhsat almaya engel herhangi bir durum ${data.licenseObstacle === "Evet" ? "bulunmaktadır." : "bulunmamaktadır."}`,
      includeFallback
    );
    if (paragraph) paragraphs.push(paragraph);
  }
  return paragraphs;
}

function composeImarStatusParagraph(title, note, fallbackSentence, includeFallback = true) {
  const cleanNote = normalizeReportDescriptionText(note || "").trim();
  if (!cleanNote && !includeFallback) return "";
  return `${title}:\n${cleanNote || fallbackSentence}`;
}

function isKuveytTurkSelectedForPlanning() {
  return foldTurkish(state.fields?.bank || "").includes("KUVEYT TURK");
}

function composeImarCalculatedEmsal(data) {
  if (normalizeYesNoChoice(data.planCancellationStay) === "Evet") return "";
  const parcelArea = parseReportNumber(data.netParcelArea);
  if (!Number.isFinite(parcelArea) || parcelArea <= 0) return "";
  const rawKaks = String(data.kaks || "").trim();
  if (rawKaks) {
    const kaks = parseReportNumber(rawKaks);
    if (Number.isFinite(kaks) && kaks > 0) {
      return formatImarSquareMeter(kaks * parcelArea);
    }
    return "";
  }
  const floorCount = parseReportNumber(data.floorCount);
  if (Number.isFinite(floorCount) && floorCount > 0) {
    return formatImarSquareMeter(floorCount * parcelArea);
  }
  return "";
}

function formatImarSquareMeter(value) {
  const number = Number.isFinite(value) ? value : parseReportNumber(value);
  if (!Number.isFinite(number)) return String(value || "");
  return `${number.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} m²`;
}

function refreshTransportAfterAddressChange() {
  const road = getNearbyArteries(state.sourceValues.nearbyPlaces?.places || [])
    .find((item) => item.id === state.fields.mainArteryId);
  if (road) {
    updateTransportFromMainArtery(road);
  }
}

function resetAddressDerivedFields() {
  [
    "neighborhood",
    "street",
    "outerDoor",
    "innerDoor",
    "uavt",
    "postalCode",
    "addressSiteName",
    "addressBlockName",
    "blockName",
    "addressRaw",
  ].forEach((key) => {
    state.fields[key] = "";
  });
  state.sourceValues.address = {};
  state.sourceValues.administrativeNeighborhoodFallback = {};
  state.sourceConflicts.address = {};
}

function clearRetiredAddressSourceFields(fields, previousApplied, targetState = state, previousFields = {}) {
  ["city", "district", "addressBlockName", "blockName"].forEach((key) => {
    const currentValue = targetState.fields[key] || "";
    const sourceOwnedValues = [previousApplied?.[key], previousFields?.[key], fields?.[key]].filter(Boolean);
    if (currentValue && sourceOwnedValues.includes(currentValue)) {
      targetState.fields[key] = "";
    }
    if (targetState.sourceValues.address?.fields) {
      targetState.sourceValues.address.fields[key] = "";
    }
    if (targetState.sourceValues.address?.applied) {
      delete targetState.sourceValues.address.applied[key];
    }
    if (targetState.sourceConflicts.address) {
      delete targetState.sourceConflicts.address[key];
    }
  });
}

function createAddressSourceSummary() {
  const wrapper = document.createElement("div");
  wrapper.className = "source-summary";
  const parsed = state.sourceValues.address;
  const fields = parsed?.fields || {};
  const conflictCount = Object.keys(state.sourceConflicts.address || {}).length;

  wrapper.innerHTML = `
    <div>
      <h4>Adres Kodu Okuma Sonucu</h4>
      <p>${parsed ? `${escapeHtml(parsed.fileName || "Dosya")} okundu.` : "Adres kodu PDF veya ekran alıntısı yüklendiğinde okunan veriler burada görünecek."}</p>
    </div>
    <div class="source-chip-row">
      <span>İl: ${escapeHtml(fields.city || "-")}</span>
      <span>İlçe: ${escapeHtml(fields.district || "-")}</span>
      <span>İdari mahalle: ${escapeHtml(fields.neighborhood || "-")}</span>
      <span>Sokak: ${escapeHtml(fields.street || "-")}</span>
      <span>Dış kapı: ${escapeHtml(fields.outerDoor || "-")}</span>
      <span>İç kapı: ${escapeHtml(fields.innerDoor || "-")}</span>
      <span>UAVT: ${escapeHtml(fields.uavt || "-")}</span>
      <span>Site / Apartman: ${escapeHtml(fields.addressSiteName || "-")}</span>
      <span>Blok: ${escapeHtml(fields.addressBlockName || "-")}</span>
      ${conflictCount ? `<span class="warning-text">${conflictCount} kullanıcı değeri korundu</span>` : ""}
    </div>
    <div class="kml-actions">
      <button class="mini-button" type="button" data-address-apply ${parsed ? "" : "disabled"}>Okunan adresi tekrar uygula</button>
    </div>
  `;

  wrapper.querySelector("[data-address-apply]").addEventListener("click", () => {
    applyAddressFieldsToReport({ force: true });
    autosave();
    render();
  });

  return wrapper;
}

function createTakbisTitleSummary() {
  const wrapper = document.createElement("div");
  wrapper.className = "source-summary";
  const parsed = state.sourceValues.takbis;
  const fields = parsed?.fields || {};
  const raw = parsed?.titleRaw || {};
  const rawRows = createTakbisRawRows(parsed?.rows || []);
  const ownerRawRows = createTakbisOwnerRawRows(parsed?.rows || []);
  const conflictCount = Object.keys(state.sourceConflicts.takbis || {}).length;
  const ownerCount = parsed?.owners?.length || 0;
  const ownerShareWarning = parsed?.ownerShareWarning || "";

  wrapper.innerHTML = `
    <div>
      <h4>TAKBİS Tapu Okuma Sonucu</h4>
      <p>${parsed ? `${escapeHtml(parsed.fileName || "Dosya")} okundu.` : "TAKBİS PDF yüklendiğinde tapu kayıt bilgileri burada görünecek."}</p>
    </div>
    <div class="source-chip-row">
      <span>TAKBİS alınma: ${escapeHtml([dateIsoToTr(fields.takbisReportDate), fields.takbisReportTime].filter(Boolean).join(" ") || "-")}</span>
      <span>Zemin tipi: ${escapeHtml(fields.groundType || "-")}</span>
      <span>Nitelik: ${escapeHtml(fields.titleQuality || "-")}</span>
      <span>Taşınmaz kimlik no: ${escapeHtml(fields.titlePropertyId || "-")}</span>
      <span>Ada: ${escapeHtml(fields.blockNo || "-")}</span>
      <span>Parsel: ${escapeHtml(fields.parcelNo || "-")}</span>
      <span>Bağımsız Bölüm No: ${escapeHtml(fields.unitNo || "-")}</span>
      <span>Blok: ${escapeHtml(fields.titleBlockName || "-")}</span>
      <span>Kat: ${escapeHtml(fields.titleFloor || "-")}</span>
      <span>Arsa payı: ${escapeHtml(fields.share || "-")}/${escapeHtml(fields.denominator || "-")}</span>
      <span>Cilt/Sayfa: ${escapeHtml(fields.registryVolume || "-")}/${escapeHtml(fields.registryPage || "-")}</span>
      <span>Tapu tarihi: ${escapeHtml(dateIsoToTr(fields.titleDate) || "-")}</span>
      <span>Yevmiye: ${escapeHtml(fields.journalNo || "-")}</span>
      <span>Tapu mahalle: ${escapeHtml(fields.titleNeighborhood || "-")}</span>
      <span>Mevkii: ${escapeHtml(fields.locationName || "-")}</span>
      <span>Yüzölçüm: ${escapeHtml(fields.landArea || raw["Yüzölçüm (m²)"] || "-")}</span>
      <span>Malik: ${escapeHtml(ownerCount || "-")}</span>
      ${ownerShareWarning ? `<span class="warning-text">${escapeHtml(ownerShareWarning)}</span>` : ""}
      ${conflictCount ? `<span class="warning-text">${conflictCount} kullanıcı değeri korundu</span>` : ""}
    </div>
    <div class="kml-actions">
      <button class="mini-button" type="button" data-takbis-title-apply ${parsed ? "" : "disabled"}>Okunan tapu bilgisini tekrar uygula</button>
    </div>
    ${rawRows ? `
      <details class="raw-source-view">
        <summary>PDF ham satırlarını göster</summary>
        <pre>${escapeHtml(rawRows)}</pre>
      </details>
    ` : ""}
  `;

  if (ownerRawRows) {
    const details = document.createElement("details");
    details.className = "raw-source-view";
    details.innerHTML = `
      <summary>Malik ham satırlarını göster</summary>
      <pre>${escapeHtml(ownerRawRows)}</pre>
    `;
    wrapper.append(details);
  }

  wrapper.querySelector("[data-takbis-title-apply]").addEventListener("click", () => {
    applyTakbisTitleFieldsToReport({ force: true });
    applyTakbisOwnersToTable(parsed?.owners || []);
    autosave();
    render();
  });

  return wrapper;
}

function createTakbisRawRows(rows) {
  const start = rows.findIndex((row) => /TAPU\s+KAYIT\s+BILGISI/.test(foldTurkish(row.text || "")));
  const end = rows.findIndex((row, index) => index > start && /TASINMAZA\s+AIT\s+SERH|MULKIYET\s+BILGILERI/.test(foldTurkish(row.text || "")));
  const sectionRows = start >= 0 ? rows.slice(start, end > start ? end : Math.min(rows.length, start + 28)) : rows;
  const wanted = /TAPU|Ada|Parsel|Arsa|Cilt|Sayfa|Yevmiye|Blok|Kat|BB|Yüz|YüzÖlçüm|Mahalle|Nitelik|Kayıt|Tarih|MÜLKİYET|Satış|^\s*[0-9]+\s*\/\s*[0-9]+\s*$/i;
  return [...sectionRows, ...rows.filter((row) => row.page === "OCR")]
    .filter((row) => start >= 0 || wanted.test(row.text || ""))
    .map((row) => `s.${row.page} - ${row.text}`)
    .join("\n");
}

function createTakbisOwnerRawRows(rows) {
  const sectionRows = getTakbisSectionRows(rows || [], "malik");
  return sectionRows
    .map((row) => `s.${row.page} - ${row.text}`)
    .join("\n");
}

function createTakbisEncumbranceSourceSummary() {
  const wrapper = document.createElement("div");
  wrapper.className = "source-summary";
  const parsed = state.sourceValues.takbis;
  const records = parsed?.encumbrances || [];
  const mortgageRecords = records.filter((record) => getEncumbranceReportTableKey(record) === "encumbranceMortgages");
  const annotationRecords = records.filter((record) => getEncumbranceReportTableKey(record) === "encumbranceAnnotations");
  const rawRows = createTakbisEncumbranceRawRows(parsed?.rows || []);
  const parsedAnnotationRows = createTakbisParsedAnnotationRows(annotationRecords);
  const parsedRows = createTakbisParsedMortgageRows(mortgageRecords);

  wrapper.innerHTML = `
    <div>
      <h4>TAKBİS Takyidat Ham Verisi</h4>
      <p>${parsed ? `${escapeHtml(parsed.fileName || "Dosya")} içinden ${records.length || 0} takyidat kaydı okundu.` : "TAKBİS PDF yüklendiğinde ham takyidat satırları burada görünür."}</p>
    </div>
    <div class="source-chip-row">
      <span>Beyan/irtifak: ${escapeHtml((state.tables.encumbranceDeclarations || []).filter((row) => Object.values(row || {}).some(Boolean)).length || "-")}</span>
      <span>Şerh: ${escapeHtml((state.tables.encumbranceAnnotations || []).filter((row) => Object.values(row || {}).some(Boolean)).length || "-")}</span>
      <span>İpotek: ${escapeHtml(mortgageRecords.length || "-")}</span>
    </div>
    ${rawRows ? `
      <details class="raw-source-view">
        <summary>PDF takyidat ham satırlarını göster</summary>
        <pre>${escapeHtml(rawRows)}</pre>
      </details>
    ` : ""}
    ${parsedAnnotationRows ? `
      <details class="raw-source-view" open>
        <summary>Şerh ayrıştırma ham kayıtlarını göster</summary>
        <pre>${escapeHtml(parsedAnnotationRows)}</pre>
      </details>
    ` : ""}
    ${parsedRows ? `
      <details class="raw-source-view" open>
        <summary>İpotek ayrıştırma ham kayıtlarını göster</summary>
        <pre>${escapeHtml(parsedRows)}</pre>
      </details>
    ` : ""}
  `;

  return wrapper;
}

function createTakbisEncumbranceRawRows(rows) {
  return getTakbisEncumbranceGroups(rows || [])
    .map((group) => [
      `--- ${group.key.toUpperCase()} ---`,
      ...group.rows.map((row) => `s.${row.page} y:${Math.round(row.y || 0)} - ${row.text}`),
    ].join("\n"))
    .join("\n\n");
}

function createTakbisParsedAnnotationRows(records) {
  return (records || []).map((record, index) => {
    const parsed = parseTakbisAnnotationRecord(record);
    const amountSource = getTakbisAnnotationSearchSource(record, parsed.c1 || parsed.description || "");
    return [
      `#${index + 1}`,
      `Tür: ${record.type || "-"}`,
      `Ham açıklama: ${record.description || "-"}`,
      `Tam ham metin: ${record.rawText || record.sourceText || record.fullText || "-"}`,
      `Ham tarih: ${record.date || "-"}`,
      `Ham yevmiye: ${record.journalNo || "-"}`,
      `Okunan şerh türü: ${parsed.c0 || "-"}`,
      `Okunan açıklama: ${parsed.c1 || "-"}`,
      `Okunan haciz tutarı: ${parsed.c2 || "-"}`,
      `Haciz arama kaynağı: ${amountSource || "-"}`,
    ].join("\n");
  }).join("\n\n");
}

function createTakbisParsedMortgageRows(records) {
  return (records || []).map((record, index) => {
    const parsed = parseTakbisMortgageRecord(record);
    return [
      `#${index + 1}`,
      `Tür: ${record.type || "-"}`,
      `Ham açıklama: ${record.description || "-"}`,
      `Ham tarih: ${record.date || "-"}`,
      `Ham yevmiye: ${record.journalNo || "-"}`,
      `Okunan lehdar: ${parsed.c0 || "-"}`,
      `Okunan derece: ${parsed.c1 || "-"}`,
      `Okunan tutar: ${parsed.c2 || "-"}`,
      `Okunan tarih: ${parsed.c3 || "-"}`,
      `Okunan yevmiye: ${parsed.c4 || "-"}`,
    ].join("\n");
  }).join("\n\n");
}

function createEkbSourceSummary() {
  const wrapper = document.createElement("div");
  wrapper.className = "source-summary";
  const parsed = state.sourceValues.ekb;
  const fields = parsed?.fields || {};
  const conflictCount = Object.keys(state.sourceConflicts.ekb || {}).length;

  wrapper.innerHTML = `
    <div>
      <h4>EKB Okuma Sonucu</h4>
      <p>${parsed ? `${escapeHtml(parsed.fileName || "Dosya")} okundu.` : "EKB PDF veya görsel yüklendiğinde belge no, tarihler ve sınıflar burada görünecek."}</p>
    </div>
    <div class="source-chip-row">
      <span>Belge no: ${escapeHtml(fields.ekbDocumentNo || "-")}</span>
      <span>Veriliş: ${escapeHtml(dateIsoToTr(fields.ekbIssueDate) || "-")}</span>
      <span>Son geçerlilik: ${escapeHtml(dateIsoToTr(fields.ekbValidUntil) || "-")}</span>
      <span>Enerji sınıfı: ${escapeHtml(fields.ekbEnergyClass || "-")}</span>
      <span>Emisyon sınıfı: ${escapeHtml(fields.ekbEmissionClass || "-")}</span>
      ${conflictCount ? `<span class="warning-text">${conflictCount} kullanıcı değeri korundu</span>` : ""}
    </div>
    <div class="kml-actions">
      <button class="mini-button" type="button" data-ekb-apply ${parsed ? "" : "disabled"}>Okunan EKB bilgisini tekrar uygula</button>
    </div>
    ${parsed ? `
      <details class="raw-source-view">
        <summary>EKB ham metnini göster</summary>
        <pre>${escapeHtml(parsed.rawText || "")}</pre>
      </details>
    ` : ""}
  `;

  wrapper.querySelector("[data-ekb-apply]").addEventListener("click", () => {
    applyEkbFieldsToReport({ force: true });
    autosave();
    render();
  });

  return wrapper;
}

function createImarSourceSummary() {
  const wrapper = document.createElement("div");
  wrapper.className = "source-summary";
  const parsed = state.sourceValues.imar;
  const fields = parsed?.fields || {};
  const conflictCount = Object.keys(state.sourceConflicts.imar || {}).length;
  const ocrNote = parsed?.meta?.usedOcr ? `<span>OCR desteği kullanıldı</span>` : "";

  wrapper.innerHTML = `
    <div>
      <h4>İmar Durumu Okuma Sonucu</h4>
      <p>${parsed ? `${escapeHtml(parsed.fileName || "Dosya")} okundu.` : "E-imar PDF veya görsel yüklendiğinde plan ve yapılaşma koşulları burada görünecek."}</p>
    </div>
    <div class="source-chip-row">
      <span>Kurum: ${escapeHtml(fields.bilgiAlinanKurum || "-")}</span>
      <span>Plan: ${escapeHtml(fields.planAdi || "-")}</span>
      <span>Ölçek: ${escapeHtml(fields.planOlcegi || "-")}</span>
      <span>Tarih: ${escapeHtml(fields.planTarihi || "-")}</span>
      <span>Lejant: ${escapeHtml(fields.planFonk || "-")}</span>
      <span>Nizam: ${escapeHtml(fields.insaatNizami || "-")}</span>
      <span>TAKS/KAKS: ${escapeHtml([fields.taks, fields.kaks].filter(Boolean).join(" / ") || "-")}</span>
      <span>Hmax/Kat: ${escapeHtml([fields.binaYuksekligi, fields.katAdedi ? `${fields.katAdedi} kat` : ""].filter(Boolean).join(" / ") || "-")}</span>
      ${ocrNote}
      <span>Bahçe: ${escapeHtml([fields.onBahce, fields.yanBahce, fields.arkaBahce].filter(Boolean).join(" / ") || "-")}</span>
      <span>Plan/Kısıtlama Notu: ${escapeHtml(fields.planRestrictionNote || "-")}</span>
      ${conflictCount ? `<span class="warning-text">${conflictCount} kullanıcı değeri korundu</span>` : ""}
    </div>
    <div class="kml-actions">
      <button class="mini-button" type="button" data-imar-apply ${parsed ? "" : "disabled"}>Okunan imar bilgisini tekrar uygula</button>
    </div>
    ${parsed ? `
      <details class="raw-source-view">
        <summary>İmar ham metnini göster</summary>
        <pre>${escapeHtml(parsed.rawText || "")}</pre>
      </details>
    ` : ""}
  `;

  wrapper.querySelector("[data-imar-apply]").addEventListener("click", () => {
    applyImarFieldsToReport({ force: true });
    autosave();
    render();
  });

  return wrapper;
}

function createNearbyEnvironmentTools(options = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = options.compact ? "nearby-tools nearby-tools-inline" : "nearby-tools";
  const source = state.sourceValues.nearbyPlaces || {};
  const places = source.places || [];
  const error = formatNearbyError(state.uploadErrors?.nearbyPlaces);
  const loadingText = source.loading ? "Çevre taraması sürüyor..." : `${places.length} öğe bulundu`;
  const statusText = places.length ? loadingText : "KML yüklendiğinde önce 500 m, gerekirse 1000 m çevre otomatik taranacak.";
  const buttonDisabled = !getSelectedMapPoint() || source.loading;
  const selectedIds = new Set(source.selectedIds || []);

  wrapper.innerHTML = `
    <div class="nearby-inline-head">
      <strong>Yakın çevre seçimi</strong>
      <button class="mini-button" type="button" data-nearby-refresh ${buttonDisabled ? "disabled" : ""}>${source.loading ? "Taranıyor" : "Çevreyi tara"}</button>
    </div>
    <div class="kml-summary">
      <span>${statusText}</span>
      <span>${selectedIds.size} öğe seçili</span>
      ${source.center ? `<span>Merkez: ${escapeHtml(source.center.lat)}, ${escapeHtml(source.center.lng)}</span>` : ""}
      ${error ? `<span class="warning-text">${escapeHtml(error)}</span>` : ""}
    </div>
    <div class="nearby-flat-list"></div>
  `;

  const list = wrapper.querySelector(".nearby-flat-list");
  if (error) {
    const status = document.createElement("p");
    status.className = "muted-note warning-text nearby-warning";
    status.textContent = error;
    wrapper.insertBefore(status, list);
  }
  const displayPlaces = getNearbyDisplayPlaces(places);
  if (!displayPlaces.length) {
    const empty = document.createElement("p");
    empty.className = "muted-note";
    empty.textContent = "Bulgu yok";
    list.append(empty);
  } else {
    displayPlaces.forEach((place) => {
      const item = document.createElement("label");
      item.className = "nearby-item nearby-flat-item";
      item.innerHTML = `
        <input type="checkbox" data-nearby-id="${escapeHtml(place.id)}" ${selectedIds.has(place.id) ? "checked" : ""} />
        <span>${escapeHtml(place.name)}<small>${Math.round(place.distance)} m</small></span>
      `;
      list.append(item);
    });
  }

  wrapper.querySelector("[data-nearby-refresh]").addEventListener("click", async () => {
    await fetchNearbyPlacesForCurrentLocation({ force: true, rotate: true });
    autosave();
    renderSection();
  });

  wrapper.querySelectorAll("[data-nearby-id]").forEach((input) => {
    input.addEventListener("change", () => {
      toggleNearbySelection(input.dataset.nearbyId, input.checked);
      autosave();
      renderSection();
      if (document.querySelector("#kmlMapPanel")) {
        renderLeafletKmlMap();
      }
    });
  });

  return wrapper;
}

function formatNearbyError(message) {
  if (!message) return "";
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Çevre servisine ulaşılamadı. İnternet bağlantısını kontrol edip tekrar deneyin.";
  }
  return message;
}

async function fetchNearbyPlacesForCurrentLocation(options = {}) {
  const point = getSelectedMapPoint();
  if (!point) {
    if (!options.silent) {
      state.uploadErrors = { ...(state.uploadErrors || {}), nearbyPlaces: "Çevre taraması için önce KML veya koordinat gerekli." };
    }
    return;
  }

  const [lat, lng] = point;
  if (state.sourceValues.nearbyPlaces?.loading && !options.force) return;
  const requestId = ++nearbyRequestSerial;

  state.sourceValues.nearbyPlaces = {
    ...(state.sourceValues.nearbyPlaces || {}),
    loading: true,
    center: { lat: Number(lat).toFixed(6), lng: Number(lng).toFixed(6) },
  };

  try {
    const environment = await fetchNearbyPlacesWithCoverage(lat, lng);
    if (requestId !== nearbyRequestSerial) return;
    const places = environment.places || [];
    const previousSelected = new Set(state.sourceValues.nearbyPlaces?.selectedIds || []);
    const validIds = new Set(places.map((place) => place.id));
    const scanCycle = options.rotate ? (state.sourceValues.nearbyPlaces?.scanCycle || 0) + 1 : state.sourceValues.nearbyPlaces?.scanCycle || 0;
    const selectedIds = getAutoNearbySelectedIds(places, previousSelected, validIds, { rotate: options.rotate, scanCycle });
    state.sourceValues.nearbyPlaces = {
      places,
      selectedIds,
      scanCycle,
      center: { lat: Number(lat).toFixed(6), lng: Number(lng).toFixed(6) },
      radius: environment.radius || nearbyRadiusMeters,
      readAt: new Date().toISOString(),
      loading: false,
    };
    state.uploadErrors = { ...(state.uploadErrors || {}), nearbyPlaces: "" };
    applyRegionAnalysisFields(environment.regionAnalysis);
    autoSelectMainArtery(places);
    updateNearbyFieldFromSelection();
  } catch (error) {
    if (requestId !== nearbyRequestSerial) return;
    state.sourceValues.nearbyPlaces = {
      ...(state.sourceValues.nearbyPlaces || {}),
      loading: false,
    };
    state.uploadErrors = {
      ...(state.uploadErrors || {}),
      nearbyPlaces: error.message || "Yakın çevre verileri okunamadı.",
    };
  }
}

function maybeAutoFetchNearbyPlaces() {
  const hasKmlPoint = Boolean(state.sourceValues.kml?.centroid || getSelectedMapPoint());
  const source = state.sourceValues.nearbyPlaces;
  const hasEnoughNearbyData = source?.readAt && hasRequiredNearbyCoverage(source.places || []);
  if (!hasKmlPoint || hasEnoughNearbyData || source?.loading || nearbyAutoFetchStarted) return;

  nearbyAutoFetchStarted = true;
  state.sourceValues.nearbyPlaces = {
    ...(state.sourceValues.nearbyPlaces || {}),
    loading: true,
  };
  if (activeSectionId === "address") {
    renderSection();
  }
  fetchNearbyPlacesForCurrentLocation({ silent: true, force: true }).then(() => {
    autosave();
    if (activeSectionId === "address") {
      renderSection();
    }
    renderValidation();
    updateStatus();
  });
  fetchAddressLookupForCurrentLocation({ silent: true }).then(() => {
    autosave();
    if (activeSectionId === "address") {
      renderSection();
    }
  });
}

async function fetchNearbyPlaces(lat, lng) {
  const query = buildNearbyOverpassQuery(lat, lng);
  const endpoints = [
    "/api/overpass",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
  ];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        lastError = new Error("Yakın çevre servisi şu anda cevap vermedi.");
        continue;
      }
      const data = await response.json();
      const elements = data.elements || [];
      const places = parseNearbyOverpassElements(elements, lat, lng);
      return {
        places,
        regionAnalysis: analyzeRegionElements(elements, places),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "Yakın çevre verileri okunamadı.");
}

async function fetchNearbyPlacesFast(lat, lng) {
  return fetchNearbyPlacesFastByRadius(lat, lng, nearbyRadiusMeters);
}

async function fetchNearbyPlacesWithCoverage(lat, lng) {
  let first = { places: [], radius: nearbyRadiusMeters, regionAnalysis: {} };
  try {
    first = await fetchNearbyPlacesFastByRadius(lat, lng, nearbyRadiusMeters);
  } catch (error) {
    first = { places: [], radius: nearbyRadiusMeters, regionAnalysis: {}, error };
  }
  if (hasRequiredNearbyCoverage(first.places)) return first;

  let merged = first;
  try {
    const expanded = await fetchNearbyPlacesFastByRadius(lat, lng, nearbyExpandedRadiusMeters);
    merged = mergeNearbyEnvironments(first, expanded);
  } catch (error) {
    merged = first;
  }

  if (hasRequiredNearbyCoverage(merged.places)) return merged;

  try {
    const fallback = await fetchFallbackNearbyPlaces(lat, lng);
    const withFallback = mergeNearbyEnvironments(merged, fallback);
    const withArteries = await ensureNearbyArteryCoverage(withFallback, lat, lng);
    if ((withArteries.places || []).length && hasRequiredNearbyCoverage(withArteries.places)) return withArteries;
    if ((withArteries.places || []).length && getNearbyArteries(withArteries.places).length) return withArteries;
    if ((withArteries.places || []).length) return withArteries;
    const settlements = await fetchLocalSettlementNearbyPlaces(lat, lng);
    if (!settlements.length) return withArteries;
    return {
      ...withArteries,
      places: dedupeAndSortNearbyPlaces([...(withArteries.places || []), ...settlements]),
      radius: nearbySettlementFallbackRadiusMeters,
      source: "local-settlements",
    };
  } catch (error) {
    if ((merged.places || []).length) return merged;
    const settlements = await fetchLocalSettlementNearbyPlaces(lat, lng);
    if (!settlements.length) return merged;
    return {
      ...merged,
      places: dedupeAndSortNearbyPlaces([...(merged.places || []), ...settlements]),
      radius: nearbySettlementFallbackRadiusMeters,
      source: "local-settlements",
    };
  }
}

async function fetchNearbyPlacesFastByRadius(lat, lng, radius) {
  const cached = getCachedNearbyEnvironment(lat, lng, radius);
  if (cached) return cached;

  const query = buildNearbyOverpassQuery(lat, lng, radius);
  const endpoints = [
    "/api/overpass",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
  ];

  try {
    const environment = await Promise.any(endpoints.map((endpoint) => fetchNearbyEndpoint(endpoint, query, lat, lng)));
    const result = { ...environment, radius };
    cacheNearbyEnvironment(lat, lng, radius, result);
    return result;
  } catch (error) {
    const lastError = error?.errors?.find(Boolean) || error;
    throw new Error(lastError?.message || "Yakın çevre verileri okunamadı.");
  }
}

async function ensureNearbyArteryCoverage(environment, lat, lng) {
  if (getNearbyArteries(environment.places || []).length >= mainArteryAutoLimit) return environment;
  try {
    const wider = await fetchNearbyPlacesFastByRadius(lat, lng, nearbyArteryFallbackRadiusMeters);
    const arteryPlaces = (wider.places || []).filter((place) => place.category === "arteries" || place.category === "junctions");
    if (!arteryPlaces.length) return environment;
    return mergeNearbyEnvironments(environment, {
      places: arteryPlaces,
      radius: nearbyArteryFallbackRadiusMeters,
      regionAnalysis: environment.regionAnalysis || {},
    });
  } catch (error) {
    return environment;
  }
}

function getNearbyCacheKey(lat, lng, radius) {
  return `${Number(lat).toFixed(5)}|${Number(lng).toFixed(5)}|${radius}`;
}

function readNearbyCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(nearbyCacheStorageKey) || "{}");
    return cache && typeof cache === "object" ? cache : {};
  } catch (error) {
    return {};
  }
}

function writeNearbyCache(cache) {
  try {
    const entries = Object.entries(cache)
      .sort(([, a], [, b]) => Number(b?.storedAt || 0) - Number(a?.storedAt || 0))
      .slice(0, nearbyCacheMaxEntries);
    localStorage.setItem(nearbyCacheStorageKey, JSON.stringify(Object.fromEntries(entries)));
  } catch (error) {
    // Cache yardımcıdır; yazılamazsa tarama akışı bozulmasın.
  }
}

function getCachedNearbyEnvironment(lat, lng, radius) {
  const cache = readNearbyCache();
  const item = cache[getNearbyCacheKey(lat, lng, radius)];
  if (!item?.environment || Date.now() - Number(item.storedAt || 0) > nearbyCacheTtlMs) return null;
  return {
    ...item.environment,
    radius,
    cached: true,
  };
}

function cacheNearbyEnvironment(lat, lng, radius, environment) {
  const cache = readNearbyCache();
  cache[getNearbyCacheKey(lat, lng, radius)] = {
    storedAt: Date.now(),
    environment,
  };
  writeNearbyCache(cache);
}

async function fetchNearbyEndpoint(endpoint, query, lat, lng) {
  let response;
  try {
    response = await fetchWithTimeout(endpoint, nearbyRequestTimeoutMs, {
      method: "POST",
      body: new URLSearchParams({ data: query }),
    });
  } catch (error) {
    response = await fetchWithTimeout(`${endpoint}?data=${encodeURIComponent(query)}`, nearbyRequestTimeoutMs);
  }
  if (!response.ok) {
    throw new Error("Yakın çevre servisi şu anda cevap vermedi.");
  }
  const data = await response.json();
  const elements = data.elements || [];
  const places = parseNearbyOverpassElements(elements, lat, lng);
  return {
    places,
    regionAnalysis: analyzeRegionElements(elements, places),
  };
}

async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Yakın çevre servisi zamanında cevap vermedi.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchFallbackNearbyPlaces(lat, lng) {
  const [nominatim, arcgis] = await Promise.allSettled([
    fetchNominatimNearbyPlaces(lat, lng),
    fetchArcgisNearbyRoads(lat, lng),
  ]);
  const places = [
    ...((nominatim.status === "fulfilled" && nominatim.value) || []),
    ...((arcgis.status === "fulfilled" && arcgis.value) || []),
  ];
  return {
    places: dedupeAndSortNearbyPlaces(places),
    radius: nearbyExpandedRadiusMeters,
    regionAnalysis: {},
  };
}

async function fetchNominatimNearbyPlaces(lat, lng) {
  const viewbox = createNominatimViewbox(lat, lng, nearbyExpandedRadiusMeters);
  const searches = [
    { query: "cadde", category: "arteries" },
    { query: "bulvar", category: "arteries" },
    { query: "karayolu", category: "arteries" },
    { query: "yolu", category: "arteries" },
    { query: "okul", category: "education" },
    { query: "lise", category: "education" },
    { query: "üniversite", category: "education" },
    { query: "metro", category: "metro" },
    { query: "kavşak", category: "junctions" },
    { query: "park", category: "parks" },
    { query: "hastane", category: "health" },
    { query: "belediye", category: "government" },
    { query: "emniyet", category: "government" },
    { query: "alışveriş merkezi", category: "malls" },
  ];
  const requests = searches.map(async (search) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&bounded=1&viewbox=${encodeURIComponent(viewbox)}&q=${encodeURIComponent(search.query)}&accept-language=tr`;
    const response = await fetchWithTimeout(url, 3500);
    if (!response.ok) return [];
    const rows = await response.json();
    return rows.map((row) => normalizeNominatimPlace(row, lat, lng, search.category)).filter(Boolean);
  });
  const results = await Promise.allSettled(requests);
  return dedupeAndSortNearbyPlaces(results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])));
}

async function fetchArcgisNearbyRoads(lat, lng) {
  const offsets = [
    [0, 0],
    [0.0035, 0],
    [-0.0035, 0],
    [0, 0.0045],
    [0, -0.0045],
    [0.006, 0.006],
    [-0.006, -0.006],
  ];
  const requests = offsets.map(async ([latOffset, lngOffset], index) => {
    const sampleLat = Number(lat) + latOffset;
    const sampleLng = Number(lng) + lngOffset;
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${encodeURIComponent(`${sampleLng},${sampleLat}`)}&f=json&langCode=tr&featureTypes=StreetInt,StreetAddress`;
    const response = await fetchWithTimeout(url, 3500);
    if (!response.ok) return null;
    const row = await response.json();
    const address = row.address || {};
  const name = cleanupRoadName(address.StreetName || address.Address || address.LongLabel || "");
    if (!name || !isAllowedMainArteryName(name, { highway: "primary" })) return null;
    return {
      id: `arcgis-road-${index}-${normalizeNameForCompare(name)}`,
      category: "arteries",
      name,
      lat: Number(row.location?.y || sampleLat),
      lng: Number(row.location?.x || sampleLng),
      distance: calculateDistanceMeters(lat, lng, Number(row.location?.y || sampleLat), Number(row.location?.x || sampleLng)),
    };
  });
  const results = await Promise.allSettled(requests);
  return dedupeAndSortNearbyPlaces(results.map((result) => (result.status === "fulfilled" ? result.value : null)).filter(Boolean));
}

function createNominatimViewbox(lat, lng, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.max(Math.cos((Number(lat) * Math.PI) / 180), 0.2));
  const minLng = Number(lng) - lngDelta;
  const maxLng = Number(lng) + lngDelta;
  const minLat = Number(lat) - latDelta;
  const maxLat = Number(lat) + latDelta;
  return `${minLng},${maxLat},${maxLng},${minLat}`;
}

function normalizeNominatimPlace(row, lat, lng, category) {
  const placeLat = Number(row.lat);
  const placeLng = Number(row.lon);
  if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) return null;
  const rawName = category === "arteries"
    ? cleanupRoadName(row.name || String(row.display_name || "").split(",")[0])
    : cleanupPlaceName(row.name || String(row.display_name || "").split(",")[0]);
  if (!rawName) return null;
  if (category === "arteries" && !isAllowedMainArteryName(rawName, { highway: "primary" })) return null;
  if (category === "education" && !isAllowedEducationName(rawName)) return null;
  return {
    id: `nominatim-${category}-${row.place_id || normalizeNameForCompare(rawName)}`,
    category,
    name: rawName,
    lat: placeLat,
    lng: placeLng,
    distance: calculateDistanceMeters(lat, lng, placeLat, placeLng),
  };
}

function dedupeAndSortNearbyPlaces(places) {
  const byKey = new Map();
  (places || []).filter(Boolean).forEach((place) => {
    const key = `${place.category}|${normalizeNameForCompare(place.name)}`;
    if (!byKey.has(key) || (place.distance || 0) < (byKey.get(key).distance || 0)) {
      byKey.set(key, place);
    }
  });
  return [...byKey.values()]
    .sort((a, b) => {
      const priorityDiff = (nearbyCategoryPriority[a.category] ?? 99) - (nearbyCategoryPriority[b.category] ?? 99);
      return priorityDiff || a.distance - b.distance;
    })
    .slice(0, nearbyResultLimit);
}

async function fetchLocalSettlementNearbyPlaces(lat, lng) {
  const rows = await loadLocalNeighborhoodDatabase();
  const places = rows
    .map((row) => {
      const distance = calculateDistanceMeters(lat, lng, row.lat, row.lng);
      if (!Number.isFinite(distance) || distance > nearbySettlementFallbackRadiusMeters) return null;
      return {
        id: `local-settlement-${row.cityKey}-${row.districtKey}-${row.neighborhoodKey}`,
        category: "settlements",
        name: row.neighborhood,
        lat: row.lat,
        lng: row.lng,
        distance,
      };
    })
    .filter(Boolean);
  return dedupeAndSortNearbyPlaces(places);
}

async function fetchAddressLookupForCurrentLocation(options = {}) {
  const point = getSelectedMapPoint();
  if (!point) return;

  const [lat, lng] = point;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=tr`,
    );
    if (!response.ok) {
      throw new Error("Adres doğrulama servisi cevap vermedi.");
    }

    const data = await response.json();
    const fields = normalizeReverseGeocodeAddress(data.address || {});
    const lookupFields = { ...fields };
    delete lookupFields.neighborhood;
    mergeLookupOptions(lookupFields);
    state.sourceValues.geoLookup = {
      ...(state.sourceValues.geoLookup || {}),
      fields,
      displayName: data.display_name || "",
      readAt: new Date().toISOString(),
    };
    state.sourceConflicts.geoLookup = {};

    Object.entries(fields).forEach(([key, value]) => {
      if (!value) return;
      if (key === "neighborhood") return;
      setFieldFromSource("geoLookup", key, value, options);
    });
    state.uploadErrors = { ...(state.uploadErrors || {}), geoLookup: "" };
  } catch (error) {
    if (!options.silent) {
      state.uploadErrors = {
        ...(state.uploadErrors || {}),
        geoLookup: error.message || "Adres doğrulama verisi alınamadı.",
      };
    }
  }
}

function normalizeReverseGeocodeAddress(address) {
  return {
    city: address.province || address.state || address.city || "",
    district: address.town || address.city_district || address.county || address.district || "",
    neighborhood: address.neighbourhood || address.suburb || address.quarter || address.village || "",
    postalCode: address.postcode || "",
  };
}

async function applyLocalNeighborhoodForCurrentLocation(options = {}) {
  const point = getSelectedMapPoint();
  if (!point) return false;
  const rows = await loadLocalNeighborhoodDatabase();
  const bound = findLocalNeighborhoodFromKmlMetadata(state.sourceValues.kml, rows, point[0], point[1]);
  const nearest = findNearestLocalNeighborhood(point[0], point[1], rows, state.sourceValues.kml);
  if (!nearest) return false;

  const fields = buildLocalNeighborhoodFields(nearest, bound);
  applyLocalNeighborhoodFields(fields, { ...options, skipKeys: ["city", "district", "neighborhood", "postalCode"] });
  return true;
}

async function applyPostalCodeFromSelectedNeighborhood(options = {}) {
  const rows = await loadLocalNeighborhoodDatabase();
  const match = findLocalNeighborhoodByAddress({
    city: state.fields.city,
    district: state.fields.district,
    neighborhood: state.fields.neighborhood,
  }, rows);
  if (!match?.postalCode) return false;
  const shouldForcePostalCode = !state.fields.postalCode || isFieldValueAppliedFromSource("postalCode");
  applyLocalNeighborhoodFields({
    postalCode: match.postalCode,
  }, { ...options, force: Boolean(options.force || shouldForcePostalCode) });
  return true;
}

function applyLocalNeighborhoodFields(fields, options = {}) {
  state.sourceValues.localNeighborhood = {
    ...(state.sourceValues.localNeighborhood || {}),
    fields,
    readAt: new Date().toISOString(),
    applied: state.sourceValues.localNeighborhood?.applied || {},
  };
  state.sourceConflicts.localNeighborhood = {};
  const skipKeys = new Set(options.skipKeys || []);
  const lookupFields = {
    city: fields.city,
    district: fields.district,
    neighborhood: fields.neighborhood,
    postalCode: fields.postalCode,
  };
  skipKeys.forEach((key) => delete lookupFields[key]);
  mergeLookupOptions(lookupFields);
  Object.entries(fields).forEach(([key, value]) => {
    if (!value) return;
    if (skipKeys.has(key)) return;
    setFieldFromSource("localNeighborhood", key, value, options);
  });
}

async function loadLocalNeighborhoodDatabase() {
  if (localNeighborhoodRows) return localNeighborhoodRows;
  if (!localNeighborhoodDatabasePromise) {
    localNeighborhoodDatabasePromise = fetch(localNeighborhoodDatabaseUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Mahalle veritabanı okunamadı.");
        return response.text();
      })
      .then(parseLocalNeighborhoodCsv);
  }
  localNeighborhoodRows = await localNeighborhoodDatabasePromise;
  return localNeighborhoodRows;
}

function parseLocalNeighborhoodCsv(text) {
  const rows = parseCsvText(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((item) => item.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((cells) => {
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
    const city = cleanupPlaceName(row.il);
    const district = cleanupPlaceName(row["ilçe"]);
    const neighborhood = cleanNeighborhoodName(row.Mahalle);
    const lat = parseCsvNumber(row.Final_Enlem || row.Enlem || row.OSM_Enlem);
    const lng = parseCsvNumber(row.Final_Boylam || row.Boylam || row.OSM_Boylam);
    if (!city || !district || !neighborhood || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return applyLocalNeighborhoodCoordinateOverride({
      city,
      district,
      neighborhood,
      postalCode: normalizePostalCodeValue(row.PK),
      lat,
      lng,
      cityKey: normalizeLocalPlaceKey(city),
      districtKey: normalizeLocalPlaceKey(district),
      neighborhoodKey: normalizeLocalNeighborhoodKey(neighborhood),
      cityCenterLat: parseCsvNumber(row.Il_Merkez_Enlem),
      cityCenterLng: parseCsvNumber(row.Il_Merkez_Boylam),
      cityCenterDistanceKm: parseCsvNumber(row.Il_Merkez_Mesafe_Km),
      cityCenterDirection: cleanupPlaceName(row.Il_Merkez_Yon),
      districtCenterLat: parseCsvNumber(row.Ilce_Merkez_Enlem),
      districtCenterLng: parseCsvNumber(row.Ilce_Merkez_Boylam),
      districtCenterDistanceKm: parseCsvNumber(row.Ilce_Merkez_Mesafe_Km),
      districtCenterDirection: cleanupPlaceName(row.Ilce_Merkez_Yon),
    });
  }).filter(Boolean);
}

function applyLocalNeighborhoodCoordinateOverride(row) {
  const override = localNeighborhoodCoordinateOverrides.find((item) =>
    item.cityKey === row.cityKey &&
    item.districtKey === row.districtKey &&
    item.neighborhoodKey === row.neighborhoodKey
  );
  if (!override) return row;
  return {
    ...row,
    lat: override.lat,
    lng: override.lng,
  };
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
}

function findNearestLocalNeighborhood(lat, lng, rows, kml = null) {
  let best = null;
  const candidates = filterLocalNeighborhoodRowsByArea(rows, kml);
  candidates.forEach((row) => {
    const distance = calculateDistanceMeters(lat, lng, row.lat, row.lng);
    if (!Number.isFinite(distance)) return;
    if (!best || distance < best.distance) {
      best = {
        ...row,
        distance,
        direction: calculateRelativeDirectionText(row.lat, row.lng, lat, lng),
        cityCenterDistance: calculateDistanceMetersIfPossible(lat, lng, row.cityCenterLat, row.cityCenterLng),
        cityCenterDirectionFromPoint: calculateRelativeDirectionText(row.cityCenterLat, row.cityCenterLng, lat, lng),
        districtCenterDistance: calculateDistanceMetersIfPossible(lat, lng, row.districtCenterLat, row.districtCenterLng),
        districtCenterDirectionFromPoint: calculateRelativeDirectionText(row.districtCenterLat, row.districtCenterLng, lat, lng),
      };
    }
  });
  return best;
}

function findLocalNeighborhoodByAddress(address, rows) {
  const cityKey = normalizeLocalPlaceKey(address.city);
  const districtKey = normalizeLocalPlaceKey(address.district);
  const neighborhoodKey = normalizeLocalNeighborhoodKey(address.neighborhood);
  if (!neighborhoodKey) return null;
  const candidates = rows.filter((row) => {
    if (cityKey && row.cityKey !== cityKey) return false;
    if (districtKey && row.districtKey !== districtKey) return false;
    return row.neighborhoodKey === neighborhoodKey;
  });
  return candidates[0] || null;
}

function findLocalNeighborhoodFromKmlMetadata(kml, rows, lat, lng) {
  const kmlNeighborhood = cleanNeighborhoodName(kml?.parcelNeighborhood || "");
  const neighborhoodKey = normalizeLocalNeighborhoodKey(kmlNeighborhood);
  if (!neighborhoodKey) return null;
  const cityKey = normalizeLocalPlaceKey(kml?.fields?.city || state.fields.city || state.fields.titleCity || "");
  const districtKey = normalizeLocalPlaceKey(kml?.fields?.district || state.fields.district || state.fields.titleDistrict || "");
  const allCandidates = rows.filter((row) => localNeighborhoodKeyMatches(row.neighborhoodKey, neighborhoodKey));
  const candidates = filterLocalNeighborhoodRowsByArea(allCandidates, kml, { cityKey, districtKey });
  if (!candidates.length) return null;
  const matched = candidates
    .map((row) => ({
      ...row,
      distanceToPoint: calculateDistanceMeters(lat, lng, row.lat, row.lng),
    }))
    .sort((a, b) => a.distanceToPoint - b.distanceToPoint)[0];
  return {
    ...matched,
    neighborhood: kmlNeighborhood,
    distance: calculateDistanceMeters(lat, lng, matched.lat, matched.lng),
    direction: calculateRelativeDirectionText(matched.lat, matched.lng, lat, lng),
    cityCenterDistance: calculateDistanceMetersIfPossible(lat, lng, matched.cityCenterLat, matched.cityCenterLng),
    cityCenterDirectionFromPoint: calculateRelativeDirectionText(matched.cityCenterLat, matched.cityCenterLng, lat, lng),
    districtCenterDistance: calculateDistanceMetersIfPossible(lat, lng, matched.districtCenterLat, matched.districtCenterLng),
    districtCenterDirectionFromPoint: calculateRelativeDirectionText(matched.districtCenterLat, matched.districtCenterLng, lat, lng),
  };
}

function filterLocalNeighborhoodRowsByArea(rows, kml = null, areaKeys = {}) {
  const cityKey = areaKeys.cityKey || normalizeLocalPlaceKey(kml?.fields?.city || state.fields.city || state.fields.titleCity || "");
  const districtKey = areaKeys.districtKey || normalizeLocalPlaceKey(kml?.fields?.district || state.fields.district || state.fields.titleDistrict || "");
  const districtRows = rows.filter((row) => {
    if (cityKey && row.cityKey !== cityKey) return false;
    if (districtKey && row.districtKey !== districtKey) return false;
    return true;
  });
  if (districtRows.length) return districtRows;
  const cityRows = rows.filter((row) => cityKey && row.cityKey === cityKey);
  return cityRows.length ? cityRows : rows;
}

function localNeighborhoodKeyMatches(rowKey, targetKey) {
  if (!rowKey || !targetKey) return false;
  return rowKey === targetKey || rowKey.endsWith(` ${targetKey}`) || rowKey.includes(` ${targetKey} `);
}

function buildLocalNeighborhoodFields(row, boundRow = null) {
  const bound = boundRow || row;
  return {
    city: row.city,
    district: row.district,
    neighborhood: row.neighborhood,
    postalCode: row.postalCode,
    boundNeighborhood: bound ? `${bound.neighborhood} - ${bound.district} / ${bound.city}` : "",
    boundNeighborhoodDistance: bound ? formatBoundNeighborhoodDistance(bound.distance, bound.direction) : "",
    nearestNeighborhood: `${row.neighborhood} - ${row.district} / ${row.city}`,
    nearestNeighborhoodDistance: formatDistanceWithDirection(row.distance, row.direction),
    districtCenterDistance: formatDistanceWithDirection(row.districtCenterDistance, row.districtCenterDirectionFromPoint) || formatCenterDistance(row.districtCenterDistanceKm, row.districtCenterDirection),
    cityCenterDistance: formatDistanceWithDirection(row.cityCenterDistance, row.cityCenterDirectionFromPoint) || formatCenterDistance(row.cityCenterDistanceKm, row.cityCenterDirection),
  };
}

function cleanNeighborhoodName(value) {
  const withoutSuffix = stripNeighborhoodSuffix(cleanupPlaceName(value));
  return normalizeReportTitleText(withoutSuffix);
}

function stripNeighborhoodSuffix(value) {
  let text = cleanupPlaceName(value);
  let previous = "";
  while (text && text !== previous) {
    previous = text;
    text = text
      .replace(/\s+(mahallesi|mahalle|mah\.?|köyü|koyu|köy|koy)$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return text;
}

function normalizeLocalNeighborhoodKey(value) {
  return normalizeLocalPlaceKey(stripNeighborhoodSuffix(value));
}

function normalizeLocalPlaceKey(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/[ıi]/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCsvNumber(value) {
  const number = Number.parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : Number.NaN;
}

function formatDistanceMeters(value) {
  const distance = Number(value);
  if (!Number.isFinite(distance)) return "";
  if (distance >= 1000) return `${(distance / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} km`;
  return `${Math.round(distance)} m`;
}

function formatDistanceWithDirection(distance, direction) {
  const text = formatDistanceMeters(distance);
  return text && direction ? `${text} ${direction}` : text;
}

function formatBoundNeighborhoodDistance(distance, direction) {
  const text = formatDistanceMeters(distance);
  if (!text) return "";
  if (!direction) return text;
  return `Taşınmaz mahalle merkezinin ${text} ${direction}`;
}

function formatCenterDistance(distanceKm, direction) {
  if (!Number.isFinite(distanceKm)) return "";
  const distance = `${distanceKm.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} km`;
  return direction ? `${distance} ${direction}` : distance;
}

function calculateDistanceMetersIfPossible(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every((value) => Number.isFinite(Number(value)))) return Number.NaN;
  return calculateDistanceMeters(lat1, lng1, lat2, lng2);
}

function calculateRelativeDirectionText(fromLat, fromLng, toLat, toLng) {
  if (![fromLat, fromLng, toLat, toLng].every((value) => Number.isFinite(Number(value)))) return "";
  const bearing = calculateBearing(fromLat, fromLng, toLat, toLng);
  const directions = ["kuzeyinde", "kuzeydoğusunda", "doğusunda", "güneydoğusunda", "güneyinde", "güneybatısında", "batısında", "kuzeybatısında"];
  return directions[Math.round(bearing / 45) % 8];
}

function buildNearbyOverpassQuery(lat, lng, radius = nearbyRadiusMeters) {
  const around = `(around:${radius},${lat},${lng})`;
  return `
    [out:json][timeout:8];
    (
      nwr${around}["amenity"~"townhall|courthouse|police|post_office|fire_station|public_building"];
      nwr${around}["office"="government"];
      nwr${around}["office"~"administrative|public"];
      nwr${around}["historic"];
      nwr${around}["tourism"~"museum|attraction|viewpoint"];
      nwr${around}["leisure"~"park|garden|playground|sports_centre|recreation_ground"];
      nwr${around}["landuse"~"recreation_ground|grass|village_green"];
      way${around}["highway"~"motorway|trunk|primary|secondary|tertiary"]["name"];
      way${around}["highway"~"motorway|trunk|primary|secondary|tertiary"]["ref"];
      way${around}["highway"]["name"~"Cadde|Caddesi|Bulvar|Bulvarı|Bulvari|Karayolu|Otoyol|Çevre Yolu|Cevre Yolu|Yolu|Asfalt", i];
      way${around}["highway"]["ref"~"^(D|E)[ -]?[0-9]", i];
      nwr${around}["highway"~"motorway_junction|traffic_signals"]["name"];
      nwr${around}["junction"]["name"];
      nwr${around}["railway"~"station|halt|subway_entrance|tram_stop"]["name"];
      nwr${around}["station"="subway"]["name"];
      nwr${around}["public_transport"~"station|stop_position|platform"]["name"];
      nwr${around}["amenity"~"bus_station|ferry_terminal"]["name"];
      nwr${around}["amenity"~"school|university|college|kindergarten|library"]["name"];
      nwr${around}["amenity"~"hospital|clinic|doctors|pharmacy|dentist"]["name"];
      nwr${around}["shop"="mall"]["name"];
      nwr${around}["building"="retail"]["name"];
      nwr${around}["amenity"="marketplace"]["name"];
      nwr${around}["natural"~"coastline|beach|water|bay"]["name"];
      nwr${around}["water"="sea"];
      nwr${around}["waterway"~"river|stream|canal"]["name"];
    );
    out body geom ${nearbyResultLimit};
  `;
}

function parseNearbyOverpassElements(elements, lat, lng) {
  const seen = new Set();
  return elements
    .map((element) => normalizeNearbyPlace(element, lat, lng))
    .filter(Boolean)
    .filter((place) => {
      const key = `${place.category}|${normalizeNameForCompare(place.name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const priorityDiff = (nearbyCategoryPriority[a.category] ?? 99) - (nearbyCategoryPriority[b.category] ?? 99);
      return priorityDiff || a.distance - b.distance;
    })
    .slice(0, nearbyResultLimit);
}

function analyzeRegionElements(elements, places) {
  const buildingElements = elements.filter((element) => element.tags?.building);
  const buildingLevels = buildingElements
    .map((element) => parseBuildingLevel(element.tags))
    .filter((value) => Number.isFinite(value) && value > 0);
  const medianLevel = median(buildingLevels);
  const landuses = new Set(elements.map((element) => element.tags?.landuse).filter(Boolean));
  const counts = {
    buildings: buildingElements.length,
    roads: places.filter((place) => place.category === "arteries").length,
    education: places.filter((place) => place.category === "education").length,
    government: places.filter((place) => place.category === "government").length,
    parks: places.filter((place) => place.category === "parks").length,
    malls: places.filter((place) => place.category === "malls").length,
    metro: places.filter((place) => place.category === "metro").length,
    health: places.filter((place) => place.category === "health").length,
    junctions: places.filter((place) => place.category === "junctions").length,
  };

  const amenityScore = counts.education + counts.government + counts.parks + counts.malls + counts.metro + counts.health + counts.junctions;
  return {
    fields: {
      regionBuildOrder: inferBuildOrder(medianLevel, counts, landuses),
      regionFloorRange: inferFloorRange(medianLevel, counts),
      regionIncomeLevel: inferIncomeLevel(places, counts, landuses),
      infrastructureLevel: inferInfrastructureLevel(counts, amenityScore),
      developmentSpeed: inferDevelopmentSpeed(counts, landuses),
      regionBuildingAge: inferBuildingAge(elements, counts),
      developmentDensity: inferDevelopmentDensity(medianLevel, counts),
      socialNeeds: inferSocialNeeds(amenityScore),
      regionUsePurpose: inferRegionUsePurpose(landuses, counts),
      planningPrincipleHarmony: "uyumludur",
    },
    metrics: {
      medianLevel: medianLevel || "",
      amenityScore,
      ...counts,
      landuses: [...landuses],
    },
  };
}

function applyRegionAnalysisFields(regionAnalysis) {
  if (!regionAnalysis?.fields) return;
  state.sourceValues.regionAnalysis = {
    ...(state.sourceValues.regionAnalysis || {}),
    fields: regionAnalysis.fields,
    metrics: regionAnalysis.metrics || {},
    readAt: new Date().toISOString(),
  };
  state.sourceConflicts.regionAnalysis = {};

  Object.entries(regionAnalysis.fields).forEach(([key, value]) => {
    if (!value) return;
    setFieldFromSource("regionAnalysis", key, value);
  });
  refreshEnvironmentDescriptionFromCurrentFields("regionUsePurpose");
}

function parseBuildingLevel(tags = {}) {
  const raw = tags["building:levels"] || tags.levels || tags["building:levels:aboveground"];
  if (!raw) return null;
  const match = String(raw).replace(",", ".").match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Number(match[0]) : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function inferFloorRange(medianLevel, counts) {
  if (medianLevel) {
    if (medianLevel <= 2) return "1-2";
    if (medianLevel <= 4) return "3-4";
    if (medianLevel <= 8) return "5-8";
    if (medianLevel <= 12) return "9-12";
    return "12+";
  }
  if (counts.buildings > 45) return "5-8";
  if (counts.buildings > 15) return "3-4";
  return "";
}

function inferBuildOrder(medianLevel, counts, landuses) {
  if (medianLevel && medianLevel >= 9) return "blok";
  if (landuses.has("commercial") || landuses.has("retail")) return "karma";
  if (counts.buildings >= 12) return "ayrık";
  return "";
}

function inferIncomeLevel(places, counts, landuses) {
  const privateSchoolCount = places.filter((place) => /özel|kolej|college|akademi/i.test(place.name)).length;
  if (counts.malls || privateSchoolCount >= 2 || landuses.has("commercial") || landuses.has("retail")) return "orta ve üst";
  if (counts.education + counts.parks + counts.government >= 4) return "orta";
  return "";
}

function inferInfrastructureLevel(counts, amenityScore) {
  if (counts.roads >= 3 && amenityScore >= 8) return "çok iyi";
  if (counts.roads >= 1 && amenityScore >= 3) return "iyi";
  if (counts.roads >= 1 || amenityScore >= 2) return "orta";
  return "";
}

function inferDevelopmentSpeed(counts, landuses) {
  if (landuses.has("construction")) return "yüksek";
  if (counts.buildings >= 30) return "orta";
  if (counts.buildings > 0) return "düşük";
  return "";
}

function inferBuildingAge(elements, counts) {
  const currentYear = new Date().getFullYear();
  const years = elements
    .map((element) => String(element.tags?.start_date || element.tags?.["building:start_date"] || "").match(/\b(19|20)\d{2}\b/)?.[0])
    .filter(Boolean)
    .map(Number);
  const medianYear = median(years);
  if (medianYear) {
    const age = currentYear - medianYear;
    if (age <= 5) return "yeni";
    if (age <= 10) return "5-10";
    if (age <= 15) return "10-15";
    if (age <= 20) return "15-20";
    if (age <= 25) return "20-25";
    if (age <= 30) return "20-30";
    return "30-40";
  }
  if (counts.buildings >= 25) return "5-10";
  if (counts.buildings > 0) return "10-15";
  return "";
}

function inferDevelopmentDensity(medianLevel, counts) {
  if ((medianLevel && medianLevel >= 7) || counts.buildings >= 45) return "yüksek";
  if ((medianLevel && medianLevel >= 3) || counts.buildings >= 15) return "orta";
  if (counts.buildings > 0) return "düşük";
  return "";
}

function inferSocialNeeds(amenityScore) {
  if (amenityScore >= 8) return "kısa";
  if (amenityScore >= 3) return "orta";
  if (amenityScore > 0) return "uzun";
  return "";
}

function inferRegionUsePurpose(landuses, counts) {
  if ((landuses.has("commercial") || landuses.has("retail")) && (landuses.has("residential") || counts.buildings)) {
    return "zemin katları işyeri, normal katları konut";
  }
  if (landuses.has("commercial") || landuses.has("retail")) return "zemin katları işyeri, normal katları ofis";
  if (landuses.has("residential") || counts.buildings) return "zemin ve normal katları konut";
  return "";
}

function normalizeNearbyPlace(element, lat, lng) {
  const tags = element.tags || {};
  const category = classifyNearbyElement(tags, element.type);
  if (!category) return null;

  const geometryPoint = getClosestElementPoint(element, lat, lng);
  const elementLat = geometryPoint?.lat ?? element.lat ?? element.center?.lat;
  const elementLng = geometryPoint?.lng ?? element.lon ?? element.center?.lon;
  if (!Number.isFinite(Number(elementLat)) || !Number.isFinite(Number(elementLng))) return null;

  const rawName = tags.name || tags["name:tr"] || tags.official_name || tags.operator || (category === "arteries" ? tags.ref : "") || readableNearbyFallback(category, tags);
  const name = category === "arteries" ? cleanupRoadName(rawName) : cleanupPlaceName(rawName);
  if (!name) return null;
  if (category === "arteries" && !isAllowedMainArteryName(name, tags)) return null;
  if (category === "education" && !isAllowedEducationName(name, tags)) return null;

  return {
    id: `${element.type}-${element.id}`,
    category,
    name,
    lat: Number(elementLat),
    lng: Number(elementLng),
    distance: geometryPoint?.distance ?? calculateDistanceMeters(lat, lng, Number(elementLat), Number(elementLng)),
  };
}

function classifyNearbyElement(tags, type) {
  const roadName = tags.name || tags["name:tr"] || tags.official_name || tags.ref || "";
  const roadCompare = normalizeNameForCompare(roadName);
  if (tags.junction || /kavsak|kavsagi/i.test(roadCompare) || /motorway_junction|traffic_signals/.test(tags.highway || "")) return "junctions";
  if (/hospital|clinic|doctors|pharmacy|dentist/.test(tags.amenity || "")) return "health";
  if (/government|administrative|public/.test(tags.office || "") || /townhall|courthouse|police|post_office|fire_station|public_building/.test(tags.amenity || "")) return "government";
  if (tags.historic || /museum|attraction|viewpoint/.test(tags.tourism || "")) return "historic";
  if (/park|garden|playground|sports_centre|recreation_ground/.test(tags.leisure || "") || /recreation_ground|grass|village_green/.test(tags.landuse || "")) return "parks";
  if (type === "way" && tags.highway) {
    if (/motorway|trunk|primary|secondary|tertiary/.test(tags.highway || "") || isAllowedMainArteryName(roadName, tags)) {
      return "arteries";
    }
  }
  if (/station|halt|subway_entrance|tram_stop/.test(tags.railway || "") || /station|stop_position|platform/.test(tags.public_transport || "") || /bus_station|ferry_terminal/.test(tags.amenity || "") || tags.station === "subway") return "metro";
  if (/school|university|college|kindergarten|library/.test(tags.amenity || "")) return "education";
  if (tags.shop === "mall" || tags.amenity === "marketplace" || tags.building === "retail") return "malls";
  if (/coastline|beach|water|bay/.test(tags.natural || "") || tags.water === "sea" || /river|stream|canal/.test(tags.waterway || "")) return "coast";
  return "";
}

function isAllowedMainArteryName(name, tags = {}) {
  const compare = normalizeNameForCompare(name);
  if (/\b(sokak|sokagi|sok|sk)\b/i.test(compare)) return false;
  if (/(cadde|caddesi|bulvar|bulvari|karayolu|otoyol|cevre yolu|cevreyolu|devlet yolu|asfalti|asfalt|anayol|ana yol|yolu|\bd\s*-?\s*\d+|\be\s*-?\s*\d+)/i.test(compare)) return true;
  return /motorway|trunk|primary|secondary/i.test(tags.highway || "");
}

function isAllowedEducationName(name, tags = {}) {
  const compare = normalizeNameForCompare(`${name} ${tags.school || ""} ${tags.amenity || ""}`);
  if (/\b(kurs|surucu|dershane|akademi|akademisi|etut|egitim merkezi)\b/i.test(compare)) return false;
  return /okul|ilkokul|ortaokul|lise|universite|fakulte|kolej|school|university|college|kindergarten|anaokulu/i.test(compare);
}

function getClosestElementPoint(element, lat, lng) {
  const geometry = Array.isArray(element.geometry) ? element.geometry : [];
  if (!geometry.length) return null;
  const points = geometry
    .map((point) => ({ lat: Number(point.lat), lng: Number(point.lon ?? point.lng) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (!points.length) return null;
  if (points.length === 1) {
    return {
      ...points[0],
      distance: calculateDistanceMeters(lat, lng, points[0].lat, points[0].lng),
    };
  }

  const originLat = Number(lat);
  const originLng = Number(lng);
  const metersPerLat = 111320;
  const metersPerLng = 111320 * Math.max(Math.cos((originLat * Math.PI) / 180), 0.2);
  const project = (point) => ({
    x: (point.lng - originLng) * metersPerLng,
    y: (point.lat - originLat) * metersPerLat,
  });
  let best = null;
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    const pa = project(a);
    const pb = project(b);
    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? Math.max(0, Math.min(1, -(pa.x * dx + pa.y * dy) / lengthSquared)) : 0;
    const x = pa.x + dx * t;
    const y = pa.y + dy * t;
    const distance = Math.sqrt(x * x + y * y);
    if (!best || distance < best.distance) {
      best = {
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
        distance,
      };
    }
  }
  return best;
}

function readableNearbyFallback(category, tags) {
  if (category === "coast") return tags.natural === "beach" ? "Sahil" : "Deniz / kıyı alanı";
  if (category === "parks") return "Park / yeşil alan";
  if (category === "government") return "Kamu kurumu";
  if (category === "historic") return tags.tourism === "museum" ? "Müze" : "Tarihi / turistik nokta";
  if (category === "health") return tags.amenity === "pharmacy" ? "Eczane" : "Sağlık tesisi";
  if (category === "metro") return tags.amenity === "bus_station" ? "Otobüs terminali" : "Raylı sistem / ulaşım durağı";
  if (category === "education") return tags.amenity === "library" ? "Kütüphane" : "Eğitim kurumu";
  if (category === "malls") return tags.amenity === "marketplace" ? "Pazar alanı" : "Alışveriş merkezi";
  if (category === "junctions") return "Kavşak";
  return "";
}

function cleanupPlaceName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanupRoadName(value) {
  let text = cleanupPlaceName(value)
    .replace(/\bNo\s*[:.]?\s*\d+[A-Z]?\b/gi, "")
    .replace(/\s*\/\s*[A-Z0-9]+$/i, "")
    .replace(/\s*[-–—]\s*\d+[A-Z]?\s*$/i, "")
    .replace(/\s+\d+[A-Z]?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  text = text.replace(/\b(Caddesi|Cadde|Bulvarı|Bulvari|Bulvar|Karayolu|Otoyol|Yolu)\s+\d+[A-Z]?\b/gi, "$1").trim();
  text = text
    .replace(/\bCadde$/i, "Caddesi")
    .replace(/\bBulvar$/i, "Bulvarı")
    .replace(/\bBulvari$/i, "Bulvarı");
  return text;
}

function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearbyDisplayPlaces(places, scanCycle = state.sourceValues.nearbyPlaces?.scanCycle || 0) {
  let candidates = (places || [])
    .filter((place) => importantNearbyCategories.has(place.category))
    .sort((a, b) => {
      const priorityDiff = (nearbyCategoryPriority[a.category] ?? 99) - (nearbyCategoryPriority[b.category] ?? 99);
      return priorityDiff || a.distance - b.distance;
    });
  if (!candidates.length) {
    candidates = (places || [])
      .filter((place) => place.category !== "arteries")
      .sort((a, b) => {
        const priorityDiff = (nearbyCategoryPriority[a.category] ?? 99) - (nearbyCategoryPriority[b.category] ?? 99);
        return priorityDiff || a.distance - b.distance;
      });
  }
  if (!candidates.length) {
    candidates = getNearbyArteries(places);
  }
  if (candidates.length <= nearbyAutoLimit) return candidates;
  const start = (scanCycle * nearbyAutoLimit) % candidates.length;
  return [...candidates.slice(start), ...candidates.slice(0, start)].slice(0, nearbyAutoLimit);
}

function getAutoNearbySelectedIds(places, previousSelected, validIds, options = {}) {
  const kept = [...previousSelected].filter((id) => validIds.has(id));
  if (kept.length && !options.rotate) return kept.slice(0, nearbyAutoLimit);
  return getNearbyDisplayPlaces(places, options.scanCycle || 0).map((place) => place.id);
}

function hasRequiredNearbyCoverage(places) {
  return getNearbyArteries(places).length >= mainArteryAutoLimit && getNearbyDisplayPlaces(places).length >= nearbyAutoLimit;
}

function mergeNearbyEnvironments(primary, secondary) {
  const places = dedupeAndSortNearbyPlaces([...(primary.places || []), ...(secondary.places || [])]);

  return {
    places,
    radius: Math.max(primary.radius || nearbyRadiusMeters, secondary.radius || nearbyRadiusMeters),
    regionAnalysis: secondary.regionAnalysis || primary.regionAnalysis,
  };
}

function toggleNearbySelection(id, checked) {
  const source = state.sourceValues.nearbyPlaces || { places: [], selectedIds: [] };
  const selected = new Set(source.selectedIds || []);
  if (checked) {
    selected.add(id);
  } else {
    selected.delete(id);
  }
  state.sourceValues.nearbyPlaces = { ...source, selectedIds: [...selected] };
  updateNearbyFieldFromSelection();
}

function updateNearbyFieldFromSelection() {
  const source = state.sourceValues.nearbyPlaces || {};
  const selected = new Set(source.selectedIds || []);
  const places = (source.places || []).filter((place) => selected.has(place.id)).sort((a, b) => a.distance - b.distance);
  state.fields.nearby = buildNearbyReportText(places);
  refreshEnvironmentDescriptionFromCurrentFields("nearby");
}

function getNearbyArteries(places) {
  const arteries = (places || [])
    .filter((place) => place.category === "arteries")
    .sort((a, b) => a.distance - b.distance);
  const withinRadius = arteries.filter((place) => place.distance <= 500);
  if (withinRadius.length >= mainArteryAutoLimit) return withinRadius;
  const withinExpanded = arteries.filter((place) => place.distance <= nearbyExpandedRadiusMeters);
  return withinExpanded.length ? withinExpanded : arteries.slice(0, mainArteryAutoLimit);
}

function autoSelectMainArtery(places) {
  const roads = getNearbyArteries(places);
  if (!roads.length) return;
  const currentId = state.fields.mainArteryId || "";
  const stillValid = roads.some((road) => road.id === currentId);
  if (currentId && stillValid) {
    updateTransportFromMainArtery(roads.find((road) => road.id === currentId));
    return;
  }

  const previousSourceValue = state.sourceValues.nearbyArtery?.applied?.mainArtery || "";
  if (!state.fields.mainArtery || state.fields.mainArtery === previousSourceValue) {
    selectMainArtery(roads[0].id, { auto: true });
  }
}

function selectMainArtery(id, options = {}) {
  const roads = getNearbyArteries(state.sourceValues.nearbyPlaces?.places || []);
  const road = roads.find((item) => item.id === id);
  if (!road) return;

  state.fields.mainArteryId = road.id;
  state.sourceValues.nearbyArtery = state.sourceValues.nearbyArtery || {};
  setFieldFromSource("nearbyArtery", "mainArtery", road.name, { force: !options.auto });
  updateTransportFromMainArtery(road, { force: !options.auto });
  refreshEnvironmentDescriptionFromCurrentFields("mainArtery");
}

function updateTransportFromMainArtery(road, options = {}) {
  if (!road) return;
  const text = buildTransportDirectionText(road);
  state.sourceValues.nearbyTransport = state.sourceValues.nearbyTransport || {};
  setFieldFromSource("nearbyTransport", "transport", text, options);
}

function buildTransportDirectionText(road) {
  const street = cleanupStreetName(state.fields.street || "taşınmazın bulunduğu sokak");
  const distance = Math.max(50, Math.round((road.distance || 0) / 10) * 10);
  const direction = getDirectionTextFromRoad(road);
  const roadSuffix = road.name.match(/caddesi|cadde|bulvarı|bulvar|sokak|sokağı/i) ? road.name : `${road.name} güzergahı`;
  return `Ekspertize konu taşınmaza ulaşım için bölgenin ana arterlerinden ${roadSuffix} üzerinden ${direction} istikametine ilerlenir. Yaklaşık ${distance} metre sonra taşınmazın bulunduğu ${street} güzergahına ulaşılır. Ekspertize konu taşınmaz ${street} üzerinde yer almaktadır.`;
}

function getDirectionTextFromRoad(road) {
  const point = getSelectedMapPoint();
  if (!point || !Number.isFinite(road.lat) || !Number.isFinite(road.lng)) return "taşınmaz yönüne";
  const [lat, lng] = point;
  const bearing = calculateBearing(road.lat, road.lng, lat, lng);
  const directions = ["kuzey", "kuzeydoğu", "doğu", "güneydoğu", "güney", "güneybatı", "batı", "kuzeybatı"];
  return directions[Math.round(bearing / 45) % 8];
}

function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const toDeg = (value) => (value * 180) / Math.PI;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function cleanupStreetName(value) {
  const text = cleanupPlaceName(value).replace(/\.$/, "");
  if (!text) return "taşınmazın bulunduğu sokak";
  return /sokak|sokağı|cadde|caddesi|bulvar|bulvarı/i.test(text) ? text : `${text} Sokak`;
}

function buildNearbyReportText(places) {
  if (!places.length) return "";
  return joinTurkishList(places.map((place) => place.name));
}

function joinTurkishList(items) {
  const clean = items.map((item) => cleanupPlaceName(item)).filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} ve ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} ve ${clean[clean.length - 1]}`;
}

async function processKmlFile(file) {
  const text = await readFileAsText(file);
  const parsed = parseKml(text);
  resetKmlDerivedFields();
  state.sourceValues.kml = parsed;
  applyKmlFieldsToReport({ force: true });
  await applyLocalNeighborhoodForCurrentLocation({ force: true, silent: true }).catch(() => false);
  nearbyAutoFetchStarted = false;
  state.sourceValues.nearbyPlaces = {
    ...(state.sourceValues.nearbyPlaces || {}),
    loading: true,
    center: parsed.centroid ? { lat: parsed.centroid.lat, lng: parsed.centroid.lng } : state.sourceValues.nearbyPlaces?.center,
  };
  fetchNearbyPlacesForCurrentLocation({ silent: true, force: true }).then(() => {
    autosave();
    if (activeSectionId === "address") {
      renderSection();
    }
    renderValidation();
    updateStatus();
  });
}

function resetKmlDerivedFields() {
  nearbyRequestSerial += 1;
  nearbyAutoFetchStarted = false;
  [
    "latitude",
    "longitude",
    "boundNeighborhood",
    "boundNeighborhoodDistance",
    "nearestNeighborhood",
    "nearestNeighborhoodDistance",
    "districtCenterDistance",
    "cityCenterDistance",
    "landRoadType",
    "landRoadName",
    "landRoadDirection",
    "landRoadFrontageLength",
    "mainArtery",
    "mainArteryProximity",
    "mainArteryId",
    "transport",
    "nearby",
    "regionBuildOrder",
    "regionFloorRange",
    "regionIncomeLevel",
    "infrastructureLevel",
    "developmentSpeed",
    "regionBuildingAge",
    "developmentDensity",
    "socialNeeds",
    "regionUsePurpose",
    "planningPrincipleHarmony",
    "environmentRegionType",
    "agriculturalActivityDensity",
    "agriculturalActivityTypes",
    "agriculturalSuitability",
    "commercialFunctionDensity",
    "commercialFirmType",
    "commercialFrontageRoadType",
    "commercialDevelopmentCompleted",
    "environmentDescription",
  ].forEach((key) => {
    state.fields[key] = "";
  });
  state.fields.landRoadFrontageItems = [];
  state.sourceValues.nearbyPlaces = {};
  state.sourceValues.nearbyArtery = {};
  state.sourceValues.nearbyTransport = {};
  state.sourceValues.regionAnalysis = {};
  state.sourceValues.localNeighborhood = {};
  state.sourceConflicts.nearbyArtery = {};
  state.sourceConflicts.nearbyTransport = {};
  state.sourceConflicts.regionAnalysis = {};
  state.sourceConflicts.localNeighborhood = {};
  state.uploadErrors = {
    ...(state.uploadErrors || {}),
    nearbyPlaces: "",
    geoLookup: "",
  };
}

function parseKml(text) {
  const kmlParser = globalThis.RaporKmlParser;
  if (!kmlParser || typeof kmlParser.parseKmlDocument !== "function") {
    throw new Error("KML ayrıştırıcı yüklenemedi.");
  }

  const { extended, coordinates, centroid, rawText } = kmlParser.parseKmlDocument(text);
  const fields = {
    city: readKmlExtendedValue(extended, ["İl", "Il", "il", "IL"]),
    district: readKmlExtendedValue(extended, ["İlçe", "Ilce", "ilce", "ILCE"]),
    titleQuality: firstValue(extended, ["Nitelik", "nitelik", "NITELIK"]),
    blockNo: firstValue(extended, ["Ada", "ada", "ADA"]),
    parcelNo: firstValue(extended, ["ParselNo", "Parsel", "parsel", "PARSEL"]),
    sheetNo: firstValue(extended, ["Pafta", "pafta", "PAFTA"]) || extractPaftaFromText(rawText),
    landShape: inferLandShapeFromKmlCoordinates(coordinates),
    landNote: inferLandFrontageSummaryFromKmlCoordinates(coordinates),
    latitude: centroid?.lat || "",
    longitude: centroid?.lng || "",
  };

  return {
    fields,
    parcelNeighborhood: readKmlExtendedValue(extended, ["Mahalle", "mahalle", "MAHALLE"]),
    coordinates,
    centroid,
    readAt: new Date().toISOString(),
  };
}

function inferLandShapeFromKmlCoordinates(coordinates = []) {
  const projected = projectKmlCoordinatesToMeters(coordinates);
  const points = removeClosingDuplicatePoints(removeNearDuplicatePoints(projected));
  if (points.length < 3) return "";

  const perimeter = calculatePolygonPerimeter(points);
  const area = Math.abs(calculatePolygonArea(points));
  if (!perimeter || !area) return "";

  const bounds = getPointBounds(points);
  const diagonal = Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const tolerance = Math.max(1, diagonal * 0.04);
  const simplified = simplifyClosedPolygon(points, tolerance);
  const vertexCount = simplified.length;

  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
  if (vertexCount >= 8 && circularity >= 0.78) return "Daire";

  const orientedBox = calculatePrincipalOrientedBox(points);
  if (orientedBox.area > 0) {
    const fillRatio = area / orientedBox.area;
    const rightAngleShare = calculateRightAngleShare(simplified);
    const parallelPairCount = countParallelEdgePairs(simplified);
    const isVisuallyRectangular = rightAngleShare >= 0.55 && (parallelPairCount >= 2 || vertexCount > 5);
    if (fillRatio >= 0.6 && isVisuallyRectangular) {
      return orientedBox.aspectRatio <= 1.25 ? "Kare" : "Dikdörtgen";
    }
  }

  if (vertexCount <= 3 && points.length <= 4) return "Üçgen";
  if (vertexCount <= 5 && hasTrapezoidLikeParallelEdges(simplified)) return "Yamuk";
  return "Amorf";
}

function inferLandFrontageSummaryFromKmlCoordinates(coordinates = []) {
  const directionTotals = getKmlFrontageOptionsFromCoordinates(coordinates);
  if (!directionTotals.length) return "";
  const formattedLengths = directionTotals
    .map((edge) => `${edge.direction} cephesi ${formatMeterLength(edge.length)}`)
    .join(", ");
  return `KML sınırına göre yaklaşık cephe/kenar uzunlukları: ${formattedLengths}.`;
}

function getKmlFrontageOptionsFromCoordinates(coordinates = []) {
  const projected = projectKmlCoordinatesToMeters(coordinates);
  const points = removeClosingDuplicatePoints(removeNearDuplicatePoints(projected));
  if (points.length < 3) return [];

  const bounds = getPointBounds(points);
  const diagonal = Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const tolerance = Math.max(1, diagonal * 0.018);
  const simplified = simplifyClosedPolygonToMaxVertices(points, tolerance, 8);
  if (simplified.length < 3) return [];

  const lengths = simplified.map((point, index) => {
    const next = simplified[(index + 1) % simplified.length];
    return {
      direction: getEdgeFacingDirection(simplified, index),
      length: Math.hypot(point.x - next.x, point.y - next.y),
    };
  }).filter((edge) => Number.isFinite(edge.length) && edge.length > 0.5);

  if (!lengths.length) return [];
  return mergeFrontageLengthsByDirection(lengths);
}

function formatMeterLength(value) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`;
}

function mergeFrontageLengthsByDirection(edges = []) {
  const directionOrder = ["Kuzey", "Kuzeydoğu", "Doğu", "Güneydoğu", "Güney", "Güneybatı", "Batı", "Kuzeybatı", "Belirsiz"];
  const totals = new Map();
  edges.forEach((edge) => {
    const direction = edge.direction || "Belirsiz";
    totals.set(direction, (totals.get(direction) || 0) + Number(edge.length || 0));
  });
  return directionOrder
    .filter((direction) => totals.has(direction))
    .map((direction) => ({ direction, length: totals.get(direction) }));
}

function simplifyClosedPolygonToMaxVertices(points = [], tolerance = 1, maxVertices = 8) {
  let simplified = simplifyClosedPolygon(points, tolerance);
  let nextTolerance = tolerance;
  for (let pass = 0; pass < 12 && simplified.length > maxVertices; pass += 1) {
    nextTolerance *= 1.25;
    const next = simplifyClosedPolygon(points, nextTolerance);
    if (next.length < 3 || next.length === simplified.length) break;
    simplified = next;
  }

  while (simplified.length > maxVertices) {
    simplified = removeLeastVisiblePolygonVertex(simplified);
  }
  return simplified;
}

function removeLeastVisiblePolygonVertex(points = []) {
  if (points.length <= 3) return points;
  let removeIndex = -1;
  let smallestDistance = Infinity;
  points.forEach((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const distance = distancePointToSegment(point, previous, next);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      removeIndex = index;
    }
  });
  return points.filter((_, index) => index !== removeIndex);
}

function getEdgeFacingDirection(points = [], index = 0) {
  const point = points[index];
  const next = points[(index + 1) % points.length];
  const signedArea = calculatePolygonArea(points);
  const dx = next.x - point.x;
  const dy = next.y - point.y;
  const outward = signedArea >= 0
    ? { x: dy, y: -dx }
    : { x: -dy, y: dx };
  return getCompassDirectionFromVector(outward.x, outward.y);
}

function getCompassDirectionFromVector(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || (!x && !y)) return "Belirsiz";
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  const normalized = (90 - angle + 360) % 360;
  const directions = ["Kuzey", "Kuzeydoğu", "Doğu", "Güneydoğu", "Güney", "Güneybatı", "Batı", "Kuzeybatı"];
  return directions[Math.round(normalized / 45) % directions.length];
}

function projectKmlCoordinatesToMeters(coordinates = []) {
  const valid = coordinates
    .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (!valid.length) return [];

  const centerLat = valid.reduce((sum, point) => sum + point.lat, 0) / valid.length;
  const latScale = 110540;
  const lngScale = 111320 * Math.cos((centerLat * Math.PI) / 180);
  return valid.map((point) => ({
    x: point.lng * lngScale,
    y: point.lat * latScale,
  }));
}

function removeClosingDuplicatePoints(points = []) {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  return Math.hypot(first.x - last.x, first.y - last.y) < 0.2 ? points.slice(0, -1) : points;
}

function removeNearDuplicatePoints(points = []) {
  const clean = [];
  points.forEach((point) => {
    const last = clean[clean.length - 1];
    if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 0.2) {
      clean.push(point);
    }
  });
  return clean;
}

function simplifyClosedPolygon(points = [], tolerance = 1) {
  let simplified = [...points];
  for (let pass = 0; pass < 20 && simplified.length > 3; pass += 1) {
    const next = simplified.filter((point, index, list) => {
      const previous = list[(index - 1 + list.length) % list.length];
      const following = list[(index + 1) % list.length];
      return distancePointToSegment(point, previous, following) > tolerance;
    });
    if (next.length === simplified.length || next.length < 3) break;
    simplified = next;
  }
  return simplified;
}

function distancePointToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  const projected = { x: start.x + ratio * dx, y: start.y + ratio * dy };
  return Math.hypot(point.x - projected.x, point.y - projected.y);
}

function calculatePolygonArea(points = []) {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function calculatePolygonPerimeter(points = []) {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + Math.hypot(point.x - next.x, point.y - next.y);
  }, 0);
}

function getPointBounds(points = []) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

function calculatePrincipalOrientedBox(points = []) {
  const center = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  center.x /= points.length;
  center.y /= points.length;

  const covariance = points.reduce(
    (acc, point) => {
      const x = point.x - center.x;
      const y = point.y - center.y;
      acc.xx += x * x;
      acc.xy += x * y;
      acc.yy += y * y;
      return acc;
    },
    { xx: 0, xy: 0, yy: 0 },
  );
  const angle = Math.atan2(2 * covariance.xy, covariance.xx - covariance.yy) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const projections = points.map((point) => ({
    x: (point.x - center.x) * cos + (point.y - center.y) * sin,
    y: -(point.x - center.x) * sin + (point.y - center.y) * cos,
  }));
  const bounds = getPointBounds(projections);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  return {
    area: width * height,
    aspectRatio: minSide > 0 ? maxSide / minSide : Infinity,
  };
}

function calculateRightAngleShare(points = []) {
  if (points.length < 4) return 0;
  const rightAngles = points.filter((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const vectorA = { x: previous.x - point.x, y: previous.y - point.y };
    const vectorB = { x: next.x - point.x, y: next.y - point.y };
    const lengthA = Math.hypot(vectorA.x, vectorA.y);
    const lengthB = Math.hypot(vectorB.x, vectorB.y);
    if (!lengthA || !lengthB) return false;
    const cosine = Math.max(-1, Math.min(1, (vectorA.x * vectorB.x + vectorA.y * vectorB.y) / (lengthA * lengthB)));
    const angle = Math.acos(cosine);
    return Math.abs(angle - Math.PI / 2) <= Math.PI / 5;
  });
  return rightAngles.length / points.length;
}

function hasTrapezoidLikeParallelEdges(points = []) {
  return countParallelEdgePairs(points) === 1;
}

function countParallelEdgePairs(points = []) {
  if (points.length < 4) return 0;
  const angles = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return Math.atan2(next.y - point.y, next.x - point.x);
  });
  let count = 0;
  for (let index = 0; index < angles.length; index += 1) {
    for (let other = index + 1; other < angles.length; other += 1) {
      if (Math.abs(index - other) === 1 || Math.abs(index - other) === angles.length - 1) continue;
      const diff = Math.abs(Math.atan2(Math.sin(angles[index] - angles[other]), Math.cos(angles[index] - angles[other])));
      if (Math.min(diff, Math.PI - diff) <= Math.PI / 12) count += 1;
    }
  }
  return count;
}

function firstValue(values, keys) {
  for (const key of keys) {
    if (values[key]) return values[key];
  }
  return "";
}

function readKmlExtendedValue(values, labels) {
  const labelKeys = labels.map(normalizeLocalPlaceKey);
  for (const [key, value] of Object.entries(values || {})) {
    if (labelKeys.includes(normalizeLocalPlaceKey(key))) return value;
  }
  return "";
}

function extractPaftaFromText(text) {
  const match = text.match(/pafta\s*(?:no|numarası|numarasi)?\s*[:\-]?\s*([A-ZÇĞİÖŞÜ0-9/.\-\s]{2,30})/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function applyKmlFieldsToReport(options = {}) {
  const fields = state.sourceValues.kml?.fields || {};
  state.sourceConflicts.kml = {};
  mergeLookupOptions({
    city: fields.city,
    district: fields.district,
  });

  Object.entries(fields).forEach(([key, value]) => {
    if (!value) return;
    setFieldFromSource("kml", key, value, options);
  });
  applyAdministrativeNeighborhoodFallback("kml", state.sourceValues.kml?.parcelNeighborhood);
}

function applyAdministrativeNeighborhoodFallback(source, value) {
  const neighborhood = cleanNeighborhoodName(value || "");
  if (!neighborhood || hasUavtAddressSource()) return;
  const currentValue = state.fields.neighborhood || "";
  const currentSource = state.sourceValues.administrativeNeighborhoodFallback?.source || "";
  if (source === "kml" && currentValue && currentSource && currentSource !== "kml") return;
  if (currentValue && !currentSource) return;

  state.sourceValues.administrativeNeighborhoodFallback = {
    source,
    value: neighborhood,
    readAt: new Date().toISOString(),
  };
  state.sourceValues[source] = state.sourceValues[source] || {};
  setFieldFromSource(source, "neighborhood", neighborhood, { force: !currentValue || currentSource === source || (source === "takbis" && currentSource === "kml") });
}

function hasUavtAddressSource() {
  return Boolean(state.sourceValues.address?.fileName || state.sourceValues.address?.rawText);
}

function setFieldFromSource(source, key, value, options = {}) {
  const nextValue = normalizeReportFieldValue(key, value);
  const currentValue = state.fields[key] || "";
  const previousSourceValue = state.sourceValues[source]?.applied?.[key] || "";
  const shouldApply = options.force || !currentValue || currentValue === previousSourceValue;

  state.sourceValues[source].applied = {
    ...(state.sourceValues[source].applied || {}),
    [key]: nextValue,
  };

  if (shouldApply) {
    state.fields[key] = nextValue;
    delete state.sourceConflicts[source]?.[key];
    return;
  }

  state.sourceConflicts[source] = {
    ...(state.sourceConflicts[source] || {}),
    [key]: {
      currentValue,
      suggestedValue: nextValue,
    },
  };
}

function renderLeafletKmlMap() {
  const panel = document.querySelector("#kmlMapPanel");
  const parsed = state.sourceValues.kml;
  if (!panel) return;

  const selectedPoint = getSelectedMapPoint();
  const hasKmlGeometry = Boolean(parsed?.coordinates?.length);

  if (!hasKmlGeometry && !selectedPoint) {
    renderKmlMapFallback("KML dosyası yükleyin veya enlem/boylam alanlarını doldurun.");
    return;
  }

  if (!isLeafletReady()) {
    renderStaticKmlMap();
    return;
  }

  try {
    const leaflet = window.L;

  if (leafletMap) {
    leafletMap.remove();
  }

  panel.innerHTML = "";
  leafletMap = null;
  leafletKmlLayer = null;
  leafletSelectedMarker = null;

  const center = selectedPoint || (parsed.centroid
    ? [Number(parsed.centroid.lat), Number(parsed.centroid.lng)]
    : [parsed.coordinates[0].lat, parsed.coordinates[0].lng]);
  const path = hasKmlGeometry ? parsed.coordinates.map((point) => [point.lat, point.lng]) : [];

  leafletMap = leaflet.map(panel).setView(center, 16);

  getLeafletTileLayer().addTo(leafletMap);

  if (path.length) {
    leafletKmlLayer = leaflet.polygon(path, {
      color: "#d92525",
      weight: 3,
      opacity: 0.95,
      fillColor: "#d92525",
      fillOpacity: 0.16,
    }).addTo(leafletMap);
  }

  leafletSelectedMarker = leaflet.marker(center, { draggable: true })
    .addTo(leafletMap)
    .bindPopup(`Seçili konum${parsed?.fields?.sheetNo ? `<br>Pafta: ${escapeHtml(parsed.fields.sheetNo)}` : ""}`);

  leafletSelectedMarker.bindTooltip("KONU TAŞINMAZ", {
    permanent: true,
    direction: "left",
    offset: [-10, -22],
    className: "subject-map-label",
  });

  leafletSelectedMarker.on("dragend", (event) => {
    const point = event.target.getLatLng();
    updateSelectedCoordinates(point.lat, point.lng);
  });

  leafletMap.on("click", (event) => {
    const { lat, lng } = event.latlng;
    updateSelectedCoordinates(lat, lng);
    leafletSelectedMarker.setLatLng([lat, lng]);
  });

  renderSelectedNearbyMarkers();

  if (leafletKmlLayer && path.length > 1) {
    leafletMap.fitBounds(leafletKmlLayer.getBounds(), {
      padding: [70, 70],
      maxZoom: 16,
    });
  } else {
    leafletMap.setView(center, 16);
  }

  window.setTimeout(() => leafletMap?.invalidateSize?.(), 0);
  } catch (error) {
    console.warn("Leaflet haritasi cizilemedi.", error);
    renderStaticKmlMap();
  }
}

function isLeafletReady() {
  return Boolean(
    window.L
      && typeof window.L.map === "function"
      && typeof window.L.tileLayer === "function"
      && typeof window.L.polygon === "function"
      && typeof window.L.marker === "function",
  );
}

function renderSelectedNearbyMarkers() {
  const places = getMapLabelPlaces().filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
  places.forEach((place) => {
    if (!isLeafletReady() || !leafletMap) return;
    const marker = window.L.circleMarker([place.lat, place.lng], {
      radius: 7,
      color: place.category === "arteries" ? "#7f1212" : "#0f6b5d",
      weight: 2,
      fillColor: place.category === "arteries" ? "#d92525" : "#1f8f7a",
      fillOpacity: 0.9,
    }).addTo(leafletMap);
    marker.bindPopup(escapeHtml(place.name));
    marker.bindTooltip(place.name, {
      permanent: true,
      direction: "top",
      offset: [0, -8],
      className: "nearby-map-label",
    });
  });
}

function getMapLabelPlaces() {
  const sourcePlaces = state.sourceValues.nearbyPlaces?.places || [];
  const selected = getSelectedNearbyPlaces();
  const arteries = getNearbyArteries(sourcePlaces).slice(0, 5);
  return [...new Map([...arteries, ...selected].map((place) => [place.id, place])).values()];
}

function renderStaticKmlMap() {
  const panel = document.querySelector("#kmlMapPanel");
  const parsed = state.sourceValues.kml;
  if (!panel) return;

  const selectedPoint = getSelectedMapPoint();
  const hasKmlGeometry = Boolean(parsed?.coordinates?.length);
  if (!hasKmlGeometry && !selectedPoint) {
    renderKmlMapFallback("KML dosyası yükleyin veya enlem/boylam alanlarını doldurun.");
    return;
  }

  const points = hasKmlGeometry ? parsed.coordinates : [];
  const center = selectedPoint || (parsed?.centroid
    ? [Number(parsed.centroid.lat), Number(parsed.centroid.lng)]
    : [Number(points[0]?.lat), Number(points[0]?.lng)]);
  const nearby = getMapLabelPlaces().filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
  const allPoints = [
    ...points.map((point) => [Number(point.lat), Number(point.lng)]),
    center,
    ...nearby.map((place) => [place.lat, place.lng]),
  ].filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

  const bounds = getCoordinateBounds(allPoints);
  const project = createStaticMapProjector(bounds, 760, 420);
  const polygon = points.map((point) => project(Number(point.lat), Number(point.lng))).map(([x, y]) => `${x},${y}`).join(" ");
  const [markerX, markerY] = project(center[0], center[1]);
  const nearbyMarkup = nearby.map((place) => {
    const [x, y] = project(place.lat, place.lng);
    return `
      <g class="static-nearby-marker">
        <circle cx="${x}" cy="${y}" r="5"></circle>
        <text x="${x + 8}" y="${y - 8}">${escapeHtml(place.name)}</text>
      </g>
    `;
  }).join("");

  panel.innerHTML = `
    <svg class="static-map" viewBox="0 0 760 420" role="img" aria-label="KML konum haritası">
      <rect class="static-map-bg" x="0" y="0" width="760" height="420"></rect>
      <g class="static-map-grid">
        ${Array.from({ length: 8 }, (_, index) => `<line x1="${index * 110}" y1="0" x2="${index * 110 - 80}" y2="420"></line>`).join("")}
        ${Array.from({ length: 6 }, (_, index) => `<line x1="0" y1="${index * 90}" x2="760" y2="${index * 90 - 35}"></line>`).join("")}
      </g>
      ${polygon ? `<polygon class="static-kml-polygon" points="${polygon}"></polygon>` : ""}
      ${nearbyMarkup}
      <g class="static-subject-marker">
        <path d="M ${markerX} ${markerY - 30} C ${markerX - 16} ${markerY - 30}, ${markerX - 18} ${markerY - 8}, ${markerX} ${markerY + 10} C ${markerX + 18} ${markerY - 8}, ${markerX + 16} ${markerY - 30}, ${markerX} ${markerY - 30} Z"></path>
        <circle cx="${markerX}" cy="${markerY - 17}" r="6"></circle>
        <text x="${markerX + 14}" y="${markerY - 24}">KONU TAŞINMAZ</text>
      </g>
      <text class="static-map-note" x="18" y="398">Yerel harita görünümü - KML sınırı ve seçili konum</text>
    </svg>
  `;
}

function getCoordinateBounds(points) {
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const latPad = Math.max((maxLat - minLat) * 0.35, 0.0008);
  const lngPad = Math.max((maxLng - minLng) * 0.35, 0.0008);
  minLat -= latPad;
  maxLat += latPad;
  minLng -= lngPad;
  maxLng += lngPad;
  return { minLat, maxLat, minLng, maxLng };
}

function createStaticMapProjector(bounds, width, height) {
  return (lat, lng) => {
    const x = 36 + ((lng - bounds.minLng) / Math.max(bounds.maxLng - bounds.minLng, 0.000001)) * (width - 72);
    const y = 36 + ((bounds.maxLat - lat) / Math.max(bounds.maxLat - bounds.minLat, 0.000001)) * (height - 72);
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  };
}

function getSelectedNearbyPlaces() {
  const source = state.sourceValues.nearbyPlaces || {};
  const selected = new Set(source.selectedIds || []);
  return (source.places || []).filter((place) => selected.has(place.id));
}

function normalizeMapMode(mode) {
  if (mode === "physical") return "hybrid";
  if (mode === "satellite" || mode === "hybrid" || mode === "street") return mode;
  return "hybrid";
}

function getMapModeOptionsMarkup(selected = state.settings.mapMode) {
  const mode = normalizeMapMode(selected);
  return [
    ["street", "Yol"],
    ["satellite", "Uydu"],
    ["hybrid", "Hibrit"],
  ].map(([value, label]) => `<option value="${value}" ${mode === value ? "selected" : ""}>${label}</option>`).join("");
}

function getMapExportRatioOptionsMarkup(selected = state.settings.mapExportRatio) {
  const value = selected || "4:3";
  return [
    "1:1",
    "3:4",
    "4:3",
    "4:5",
    "5:4",
    "9:16",
    "16:9",
  ].map((ratio) => `<option value="${ratio}" ${value === ratio ? "selected" : ""}>${ratio}</option>`).join("");
}

function getLeafletTileLayer() {
  const mode = normalizeMapMode(state.settings.mapMode);
  const imageryLayer = window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri",
    maxZoom: 20,
    crossOrigin: true,
  });
  if (mode === "satellite") {
    return imageryLayer;
  }
  if (mode === "hybrid") {
    return window.L.layerGroup([
      imageryLayer,
      window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Road labels © Esri",
        maxZoom: 20,
        crossOrigin: true,
        opacity: 0.96,
      }),
      window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Place labels © Esri",
        maxZoom: 20,
        crossOrigin: true,
        opacity: 0.96,
      }),
    ]);
  }

  return window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 20,
    crossOrigin: true,
  });
}

async function exportMapAsJpeg(triggerButton) {
  const selectedPoint = getSelectedMapPoint();
  const parsed = state.sourceValues.kml;
  const hasKmlGeometry = Boolean(parsed?.coordinates?.length);
  if (!selectedPoint && !hasKmlGeometry) {
    window.alert("Harita kaydı için önce KML veya koordinat bilgisi gerekiyor.");
    return;
  }

  const originalButtonText = triggerButton?.textContent;
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.textContent = "JPEG HAZIRLANIYOR...";
  }
  setMapExportStatus("Harita JPEG kaydi hazirlaniyor...");

  const canvas = document.createElement("canvas");
  const exportSize = getMapExportCanvasSize();
  canvas.width = exportSize.width;
  canvas.height = exportSize.height;
  const context = canvas.getContext("2d");
  const center = getExportMapCenter(selectedPoint, parsed);
  const subjectPoint = selectedPoint || (parsed?.centroid ? [Number(parsed.centroid.lat), Number(parsed.centroid.lng)] : center);
  const zoom = getExportMapZoom(center, parsed, canvas.width, canvas.height);
  const topLeft = latLngToWorldPixel(center[0], center[1], zoom);
  topLeft.x -= canvas.width / 2;
  topLeft.y -= canvas.height / 2;

  context.fillStyle = normalizeMapMode(state.settings.mapMode) === "street" ? "#eef2ef" : "#d8e2df";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await drawExportTiles(context, canvas, topLeft, zoom, "base");
  await drawExportTiles(context, canvas, topLeft, zoom, "labels");
  drawExportKmlPolygon(context, parsed, topLeft, zoom);
  if (state.settings.mapExportLabels !== false) {
    drawExportPlaces(context, topLeft, zoom);
  }
  drawExportSubject(context, subjectPoint, topLeft, zoom);

  try {
    const link = document.createElement("a");
    link.download = `harita-konu-tasinmaz-${new Date().toISOString().slice(0, 10)}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = originalButtonText || "HARITAYI JPEG OLARAK KAYDET";
    }
    setMapExportStatus("JPEG kaydedildi.");
  } catch (error) {
    try {
      drawExportFallbackBase(context, canvas);
      drawExportKmlPolygon(context, parsed, topLeft, zoom);
      if (state.settings.mapExportLabels !== false) {
        drawExportPlaces(context, topLeft, zoom);
      }
      drawExportSubject(context, subjectPoint, topLeft, zoom);
      const fallbackLink = document.createElement("a");
      fallbackLink.download = `harita-konu-tasinmaz-${new Date().toISOString().slice(0, 10)}.jpg`;
      fallbackLink.href = canvas.toDataURL("image/jpeg", 0.92);
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      fallbackLink.remove();
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.textContent = originalButtonText || "HARITAYI JPEG OLARAK KAYDET";
      }
      setMapExportStatus("Harita altligi izin vermedi; yedek JPEG kaydedildi.", true);
      return;
    } catch (fallbackError) {
      console.warn("Harita JPEG olarak kaydedilemedi.", fallbackError);
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.textContent = originalButtonText || "HARITAYI JPEG OLARAK KAYDET";
      }
      setMapExportStatus("JPEG kaydedilemedi. Haritayi yenileyip tekrar deneyin.", true);
    }
    window.alert("Harita JPEG olarak kaydedilemedi. Harita altlığı bu işlem için izin vermedi.");
  }
}

function setMapExportStatus(message, isWarning = false) {
  const status = document.querySelector("[data-map-export-status]");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-warning", Boolean(isWarning));
}

function getMapExportCanvasSize() {
  const sizes = {
    "1:1": [1400, 1400],
    "3:4": [1200, 1600],
    "9:16": [1080, 1920],
    "4:5": [1280, 1600],
    "5:4": [1600, 1280],
    "4:3": [1600, 1200],
    "16:9": [1600, 900],
  };
  const [width, height] = sizes[state.settings.mapExportRatio] || sizes["4:3"];
  return { width, height };
}

function drawExportFallbackBase(context, canvas) {
  const pixel = { x: Number.NaN, y: Number.NaN };
  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#dfe9e4";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(87, 112, 124, 0.28)";
  context.lineWidth = 12;
  for (let x = -canvas.height; x < canvas.width + canvas.height; x += 180) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + canvas.height * 0.45, canvas.height);
    context.stroke();
  }
  context.strokeStyle = "rgba(87, 112, 124, 0.18)";
  context.lineWidth = 8;
  for (let y = 90; y < canvas.height; y += 170) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y - 45);
    context.stroke();
  }
  context.fillStyle = "#58717c";
  context.font = "700 24px Arial";
  context.fillText("Harita altligi kayda izin vermedi; KML siniri ve isaretli noktalar kaydedildi.", 38, canvas.height - 42);
  drawExportSubjectCallout(context, pixel.x, pixel.y, "KONU TAŞINMAZ");
  context.restore();
}

function getExportMapCenter(selectedPoint, parsed) {
  if (leafletMap?.getCenter) {
    const center = leafletMap.getCenter();
    return [center.lat, center.lng];
  }
  if (selectedPoint) return selectedPoint;
  if (parsed?.centroid) return [Number(parsed.centroid.lat), Number(parsed.centroid.lng)];
  const first = parsed?.coordinates?.[0];
  return [Number(first?.lat) || 40.1826, Number(first?.lng) || 29.0665];
}

function getExportMapZoom(center, parsed, canvasWidth = 1600, canvasHeight = 1200) {
  if (leafletMap?.getZoom) return leafletMap.getZoom();
  const points = [
    ...(parsed?.coordinates || []).map((point) => [Number(point.lat), Number(point.lng)]),
    ...getSelectedNearbyPlaces().map((place) => [place.lat, place.lng]),
    center,
  ].filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  if (points.length < 2) return 16;

  for (let zoom = 18; zoom >= 12; zoom -= 1) {
    const projected = points.map(([lat, lng]) => latLngToWorldPixel(lat, lng, zoom));
    const width = Math.max(...projected.map((point) => point.x)) - Math.min(...projected.map((point) => point.x));
    const height = Math.max(...projected.map((point) => point.y)) - Math.min(...projected.map((point) => point.y));
    if (width <= canvasWidth * 0.84 && height <= canvasHeight * 0.78) return zoom;
  }
  return 12;
}

async function drawExportTiles(context, canvas, topLeft, zoom, layerType = "base") {
  const tileSize = 256;
  const minTileX = Math.floor(topLeft.x / tileSize);
  const maxTileX = Math.floor((topLeft.x + canvas.width) / tileSize);
  const minTileY = Math.floor(topLeft.y / tileSize);
  const maxTileY = Math.floor((topLeft.y + canvas.height) / tileSize);
  const jobs = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      const urls = getExportTileUrls(tileX, tileY, zoom, layerType);
      urls.forEach((url) => {
        jobs.push(loadTileImage(url).then((image) => {
        context.drawImage(
          image,
          Math.round(tileX * tileSize - topLeft.x),
          Math.round(tileY * tileSize - topLeft.y),
          tileSize,
          tileSize,
        );
        }).catch(() => {}));
      });
    }
  }

  await Promise.allSettled(jobs);
}

function getExportTileUrls(tileX, tileY, zoom, layerType = "base") {
  const maxTile = 2 ** zoom;
  const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
  const y = Math.max(0, Math.min(maxTile - 1, tileY));
  if (layerType === "labels") {
    if (normalizeMapMode(state.settings.mapMode) !== "hybrid") return [];
    return [
      `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${zoom}/${y}/${wrappedX}`,
      `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${zoom}/${y}/${wrappedX}`,
    ];
  }
  if (normalizeMapMode(state.settings.mapMode) !== "street") {
    return [`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${wrappedX}`];
  }
  return [`https://a.tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`];
}

function loadTileImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      reject(new Error("Harita altligi zaman asimina ugradi."));
    }, 4500);
    image.crossOrigin = "anonymous";
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Harita altligi yuklenemedi."));
    };
    image.src = url;
  });
}

function drawExportKmlPolygon(context, parsed, topLeft, zoom) {
  const coordinates = parsed?.coordinates || [];
  if (!coordinates.length) return;
  context.save();
  context.beginPath();
  coordinates.forEach((point, index) => {
    const pixel = projectExportPoint(Number(point.lat), Number(point.lng), topLeft, zoom);
    if (index === 0) context.moveTo(pixel.x, pixel.y);
    else context.lineTo(pixel.x, pixel.y);
  });
  context.closePath();
  context.fillStyle = "rgba(217, 37, 37, 0.18)";
  context.strokeStyle = "#d92525";
  context.lineWidth = 5;
  context.fill();
  context.stroke();
  context.restore();
}

function drawExportPlaces(context, topLeft, zoom) {
  const places = getMapLabelPlaces().filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));

  places.forEach((place) => {
    const pixel = projectExportPoint(place.lat, place.lng, topLeft, zoom);
    drawExportPointLabel(context, pixel.x, pixel.y, place.name, place.category === "arteries" ? "#7f1212" : "#0f6b5d");
  });
}

function drawExportSubject(context, center, topLeft, zoom) {
  const pixel = projectExportPoint(center[0], center[1], topLeft, zoom);
  drawExportSubjectCallout(context, pixel.x, pixel.y, "KONU TAŞINMAZ");
}

function drawExportSubjectCallout(context, x, y, text) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  context.save();
  context.font = "900 30px Arial";
  const paddingX = 20;
  const paddingY = 12;
  const width = Math.min(context.measureText(text).width + paddingX * 2, 430);
  const height = 58;
  const labelX = Math.max(18, Math.min(x + 42, context.canvas.width - width - 18));
  const labelY = Math.max(18, Math.min(y - height - 28, context.canvas.height - height - 18));
  const arrowBaseX = Math.max(labelX + 24, Math.min(x + 22, labelX + width - 24));

  context.fillStyle = "#c81e1e";
  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  context.beginPath();
  context.roundRect(labelX, labelY, width, height, 12);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(arrowBaseX - 18, labelY + height - 2);
  context.lineTo(arrowBaseX + 18, labelY + height - 2);
  context.lineTo(x, y - 5);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#ffffff";
  context.fillText(text, labelX + paddingX, labelY + paddingY + 27, width - paddingX * 2);
  context.restore();
}

function drawExportPointLabel(context, x, y, text, color) {
  if (/^KONU/i.test(String(text || ""))) return;
  context.save();
  context.font = "700 22px Arial";
  const paddingX = 12;
  const paddingY = 8;
  const width = Math.min(context.measureText(text).width + paddingX * 2, 420);
  const height = 42;
  const labelX = Math.max(12, Math.min(x + 12, context.canvas.width - width - 12));
  const labelY = Math.max(12, Math.min(y - height - 12, context.canvas.height - height - 12));

  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(labelX, labelY, width, height, 10);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.fillText(text, labelX + paddingX, labelY + paddingY + 20, width - paddingX * 2);

  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, 10, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function latLngToWorldPixel(lat, lng, zoom) {
  const sinLat = Math.sin((Math.max(Math.min(lat, 85.05112878), -85.05112878) * Math.PI) / 180);
  const scale = 256 * (2 ** zoom);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function projectExportPoint(lat, lng, topLeft, zoom) {
  const pixel = latLngToWorldPixel(lat, lng, zoom);
  return {
    x: pixel.x - topLeft.x,
    y: pixel.y - topLeft.y,
  };
}

function getSelectedMapPoint() {
  const lat = Number.parseFloat(String(state.fields.latitude || "").replace(",", "."));
  const lng = Number.parseFloat(String(state.fields.longitude || "").replace(",", "."));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function updateSelectedCoordinates(lat, lng) {
  const formattedLat = Number(lat).toFixed(6);
  const formattedLng = Number(lng).toFixed(6);
  state.fields.latitude = formattedLat;
  state.fields.longitude = formattedLng;

  const latInput = document.querySelector('[data-field="latitude"]');
  const lngInput = document.querySelector('[data-field="longitude"]');
  if (latInput) latInput.value = formattedLat;
  if (lngInput) lngInput.value = formattedLng;

  autosave();
  applyLocalNeighborhoodForCurrentLocation({ silent: true }).then((changed) => {
    if (!changed) return;
    autosave();
    if (activeSectionId === "address") renderSection();
    renderValidation();
    updateStatus();
  }).catch(() => {});
  fetchAddressLookupDebounced();
  renderValidation();
  updateStatus();
}

function renderKmlMapFallback(message) {
  const placeholder = document.querySelector("#kmlMapPlaceholder");
  const panel = document.querySelector("#kmlMapPanel");
  const parsed = state.sourceValues.kml;
  if (!panel) return;

  if (!placeholder) {
    panel.innerHTML = `<div class="map-placeholder" id="kmlMapPlaceholder"></div>`;
  }

  const target = document.querySelector("#kmlMapPlaceholder");
  if (!target) return;

  if (message) {
    target.textContent = message;
    return;
  }

  if (!parsed?.coordinates?.length) {
    target.textContent = "KML yüklendiğinde harita burada OpenStreetMap altlığıyla gösterilecek.";
    return;
  }

  target.innerHTML = `
    <strong>KML okundu</strong>
    <span>${parsed.coordinates.length} koordinat bulundu.</span>
    <span>Merkez: ${parsed.centroid?.lat || "-"}, ${parsed.centroid?.lng || "-"}</span>
    <span>Pafta: ${parsed.fields?.sheetNo || "-"}</span>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createPlaceholderDefinitionsPanel() {
  ensureLegacyPlaceholderRowsLoaded();

  const wrapper = document.createElement("div");
  wrapper.className = "placeholder-manager";

  const allRows = collectPlaceholderDefinitions();
  const categories = [...new Set(allRows.map((row) => row.category).filter(Boolean))];
  const sources = [...new Set(allRows.map((row) => row.source).filter(Boolean))];

  const toolbar = document.createElement("div");
  toolbar.className = "placeholder-toolbar";

  const searchField = createPlaceholderFilterField("Arama", "placeholderSearch");
  const searchInput = searchField.querySelector("input");
  searchInput.placeholder = "Placeholder, başlık, bölüm veya değer ara";

  const categoryField = createPlaceholderSelectField("Kategori", "placeholderCategory", ["", ...categories]);
  const categorySelect = categoryField.querySelector("select");

  const sourceField = createPlaceholderSelectField("Kaynak", "placeholderSource", ["", ...sources]);
  const sourceSelect = sourceField.querySelector("select");

  toolbar.append(searchField, categoryField, sourceField);

  const summary = document.createElement("div");
  summary.className = "placeholder-summary";

  const tableWrap = document.createElement("div");
  tableWrap.className = "placeholder-table-wrap";

  const renderRows = () => {
    const query = normalizeSearchText(searchInput.value);
    const category = categorySelect.value;
    const source = sourceSelect.value;
    const rows = collectPlaceholderDefinitions().filter((row) => {
      if (category && row.category !== category) return false;
      if (source && row.source !== source) return false;
      if (!query) return true;
      return normalizeSearchText([
        row.category,
        row.token,
        row.title,
        row.type,
        row.source,
        row.value,
        row.reference,
      ].join(" ")).includes(query);
    });

    summary.textContent = `${rows.length} placeholder gösteriliyor. Excel kaynağı: ${
      legacyPlaceholderRowsLoaded ? `${legacyPlaceholderRows.length} kayıt` : "yükleniyor"
    }.`;
    tableWrap.replaceChildren(createPlaceholderTable(rows));
  };

  [searchInput, categorySelect, sourceSelect].forEach((control) => {
    control.addEventListener("input", renderRows);
    control.addEventListener("change", renderRows);
  });

  wrapper.append(createUserDefaultSelectionsPanel(), toolbar, summary, tableWrap);
  renderRows();
  return wrapper;
}

function createUserDefaultSelectionsPanel() {
  const panel = document.createElement("div");
  panel.className = "placeholder-defaults-panel";

  const head = document.createElement("div");
  head.className = "placeholder-defaults-head";
  const title = document.createElement("div");
  title.innerHTML = `
    <strong>Kullanıcı Varsayılanları</strong>
    <span>Bu ayarlar sadece boş kalan ve belge/KML/PDF tarafından doldurulmamış kullanıcı alanlarına uygulanır.</span>
  `;
  const resetAllButton = document.createElement("button");
  resetAllButton.type = "button";
  resetAllButton.className = "mini-button";
  resetAllButton.textContent = "Tümünü temizle";
  resetAllButton.addEventListener("click", () => {
    state.settings.userDefaults = {};
    saveUserDefaults(state.settings.userDefaults);
    autosave();
    renderSection();
  });
  head.append(title, resetAllButton);

  const rows = collectUserDefaultEligibleFields();
  const tableWrap = document.createElement("div");
  tableWrap.className = "placeholder-defaults-table-wrap";
  const table = document.createElement("table");
  table.className = "placeholder-defaults-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Bölüm</th>
        <th>Alan</th>
        <th>Varsayılan Değer</th>
        <th>Durum</th>
        <th>İşlem</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");
  rows.forEach(({ section, field }) => {
    const tr = document.createElement("tr");
    const sourceOwned = isFieldKeyOwnedBySource(field.key);
    tr.append(
      createPlaceholderCell(section.title),
      createPlaceholderCell(field.label || field.key),
    );

    const controlCell = document.createElement("td");
    controlCell.append(createUserDefaultControl(field));

    const statusCell = document.createElement("td");
    statusCell.textContent = sourceOwned
      ? "Bu işte belge verisi korunur"
      : state.fields[field.key]
        ? "Bu işte alan dolu"
        : "Boş alanlara uygulanır";

    const actionCell = document.createElement("td");
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "mini-button placeholder-copy-button";
    clearButton.textContent = "Temizle";
    clearButton.addEventListener("click", () => {
      delete state.settings.userDefaults[field.key];
      saveUserDefaults(state.settings.userDefaults);
      autosave();
      renderSection();
    });
    actionCell.append(clearButton);

    tr.append(controlCell, statusCell, actionCell);
    tbody.append(tr);
  });

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.className = "placeholder-empty";
    emptyCell.textContent = "Varsayılan atanabilecek kullanıcı alanı bulunamadı.";
    emptyRow.append(emptyCell);
    tbody.append(emptyRow);
  }

  table.append(tbody);
  tableWrap.append(table);
  panel.append(head, tableWrap);
  return panel;
}

function collectUserDefaultEligibleFields() {
  const eligibleTypes = new Set(["select", "multiCheckbox", "conditionalYesNo", "checkbox"]);
  const rows = [];
  sections.forEach((section) => {
    if (section.id === "placeholders") return;
    (section.fields || []).forEach((field) => {
      if (!field?.key || !eligibleTypes.has(field.type)) return;
      if (!isUserDefaultEligibleField(field)) return;
      if (!getUserDefaultFieldOptions(field).length) return;
      rows.push({ section, field });
    });
  });
  return rows;
}

function isUserDefaultEligibleField(field) {
  if (field.autoFill || field.hidden || field.computed) return false;
  return !sourceGeneratedDefaultExcludedKeys.has(field.key);
}

function getUserDefaultFieldOptions(field) {
  if (field.type === "conditionalYesNo") return ["Evet", "Hayır"];
  if (field.type === "checkbox") return [field.checkedValue || "Evet", field.uncheckedValue || "Hayır"];
  return getFieldOptions(field).filter(Boolean);
}

function createUserDefaultControl(field) {
  if (field.type === "multiCheckbox") {
    return createUserDefaultMultiCheckboxControl(field);
  }

  const select = document.createElement("select");
  select.className = "placeholder-default-control";
  const current = getUserDefaultValueForField(field);
  ["", ...getUserDefaultFieldOptions(field)].forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Varsayılan yok";
    select.append(item);
  });
  select.value = current;
  select.addEventListener("change", () => updateUserDefaultField(field, select.value));
  return select;
}

function createUserDefaultMultiCheckboxControl(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "placeholder-default-checks";
  const selected = new Set(parseMultiValue(getUserDefaultValueForField(field)));
  getUserDefaultFieldOptions(field).forEach((option) => {
    const label = document.createElement("label");
    label.className = "checkbox-row";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = option;
    input.checked = selected.has(option);
    input.addEventListener("change", () => {
      const values = [...wrapper.querySelectorAll("input[type='checkbox']:checked")].map((item) => item.value);
      updateUserDefaultField(field, values.join(", "));
    });
    label.append(input, createSpan(option));
    wrapper.append(label);
  });
  return wrapper;
}

function parseMultiValue(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function updateUserDefaultField(field, value) {
  state.settings = state.settings || {};
  state.settings.userDefaults = state.settings.userDefaults || {};
  if (value) {
    state.settings.userDefaults[field.key] = value;
  } else {
    delete state.settings.userDefaults[field.key];
  }
  saveUserDefaults(state.settings.userDefaults);
  applyUserDefaultToField(field, state);
  autosave();
  renderValidation();
  updateStatus();
}

function createPlaceholderFilterField(labelText, inputName) {
  const label = document.createElement("label");
  label.className = "field placeholder-filter-field";
  label.append(createSpan(labelText));
  const input = document.createElement("input");
  input.type = "search";
  input.name = inputName;
  label.append(input);
  return label;
}

function createPlaceholderSelectField(labelText, inputName, options) {
  const label = document.createElement("label");
  label.className = "field placeholder-filter-field";
  label.append(createSpan(labelText));
  const select = document.createElement("select");
  select.name = inputName;
  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option || "Tümü";
    select.append(item);
  });
  label.append(select);
  return label;
}

function createPlaceholderTable(rows) {
  const table = document.createElement("table");
  table.className = "placeholder-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Placeholder</th>
      <th>Başlık</th>
      <th>Tür</th>
      <th>Kaynak</th>
      <th>Mevcut Değer</th>
      <th>İşlem</th>
    </tr>
  `;
  table.append(thead);

  const tbody = document.createElement("tbody");
  let currentCategory = "";
  rows.forEach((row) => {
    if (row.category !== currentCategory) {
      currentCategory = row.category;
      const groupRow = document.createElement("tr");
      groupRow.className = "placeholder-group-row";
      const groupCell = document.createElement("td");
      groupCell.colSpan = 6;
      groupCell.textContent = currentCategory || "Genel";
      groupRow.append(groupCell);
      tbody.append(groupRow);
    }

    const tr = document.createElement("tr");
    tr.append(
      createPlaceholderCell(row.token, "placeholder-token"),
      createPlaceholderCell(row.title),
      createPlaceholderCell(row.type),
      createPlaceholderCell(row.source),
      createPlaceholderCell(row.value || "-", "placeholder-value"),
    );
    const actionCell = document.createElement("td");
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "mini-button placeholder-copy-button";
    copyButton.textContent = "Kopyala";
    copyButton.addEventListener("click", () => copyPlaceholderToken(row.token, copyButton));
    actionCell.append(copyButton);
    tr.append(actionCell);
    tbody.append(tr);
  });

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 6;
    emptyCell.className = "placeholder-empty";
    emptyCell.textContent = "Kayıt bulunamadı.";
    emptyRow.append(emptyCell);
    tbody.append(emptyRow);
  }

  table.append(tbody);
  return table;
}

function createPlaceholderCell(value, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = value;
  return cell;
}

function copyPlaceholderToken(token, button) {
  const done = () => {
    const previousText = button.textContent;
    button.textContent = "Kopyalandı";
    setTimeout(() => {
      button.textContent = previousText;
    }, 1100);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(token).then(done).catch(done);
  } else {
    done();
  }
}

function ensureLegacyPlaceholderRowsLoaded() {
  if (legacyPlaceholderRowsLoaded || legacyPlaceholderRowsLoading) return;
  legacyPlaceholderRowsLoading = true;
  fetch(legacyPlaceholderDefinitionsUrl)
    .then((response) => {
      if (!response.ok) throw new Error("Placeholder listesi okunamadı.");
      return response.json();
    })
    .then((rows) => {
      legacyPlaceholderRows = Array.isArray(rows) ? rows : [];
    })
    .catch(() => {
      legacyPlaceholderRows = [];
    })
    .finally(() => {
      legacyPlaceholderRowsLoaded = true;
      legacyPlaceholderRowsLoading = false;
      if (activeSectionId === "placeholders") renderSection();
    });
}

function collectPlaceholderDefinitions() {
  return [
    ...collectApplicationFieldPlaceholders(),
    ...collectGeneratedTextPlaceholders(),
    ...collectTablePlaceholders(),
    ...collectLegacyExcelPlaceholders(),
  ];
}

function collectApplicationFieldPlaceholders() {
  const rows = [];
  sections
    .filter((section) => section.id !== "placeholders")
    .forEach((section) => {
      (section.fields || []).forEach((field) => {
        rows.push({
          category: section.title,
          token: makePlaceholderToken(field.key),
          title: field.label || field.key,
          type: field.hidden ? "Gizli Alan" : getPlaceholderFieldTypeLabel(field),
          source: "Uygulama Alanı",
          value: formatPlaceholderValue(state.fields[field.key]),
          reference: field.key,
        });
      });
      (section.uploads || []).forEach((upload) => {
        rows.push({
          category: section.title,
          token: makePlaceholderToken(`upload_${upload.id}`),
          title: upload.title,
          type: "Belge Yükleme",
          source: "Uygulama Alanı",
          value: state.uploads?.[upload.id]?.name || "",
          reference: upload.id,
        });
      });
    });
  return rows;
}

function collectGeneratedTextPlaceholders() {
  const generatedRows = [
    {
      category: "Adres ve Konum",
      key: "transport_report_text",
      title: "Ulaşım Tarifi Metni",
      value: state.fields.transport,
    },
    {
      category: "Adres ve Konum",
      key: "nearby_report_text",
      title: "Yakın Çevre Metni",
      value: state.fields.nearby,
    },
    {
      category: "Adres ve Konum",
      key: "environmental_features_text",
      title: "Çevresel Özellikler Açıklaması",
      value: state.fields.environmentDescription || buildEnvironmentalDescription(),
    },
    {
      category: "Adres ve Konum",
      key: "environmental_residential_template",
      title: "Çevresel Özellikler - Konut Bölgesi Şablonu",
      value: buildEnvironmentalDescription("Konut Bölgesi", { usePlaceholderTokens: true }),
    },
    {
      category: "Adres ve Konum",
      key: "environmental_commercial_template",
      title: "Çevresel Özellikler - Ticaret Bölgesi Şablonu",
      value: buildEnvironmentalDescription("Ticaret Bölgesi", { usePlaceholderTokens: true }),
    },
    {
      category: "Adres ve Konum",
      key: "environmental_industrial_template",
      title: "Çevresel Özellikler - Sanayi Bölgesi Şablonu",
      value: buildEnvironmentalDescription("Sanayi Bölgesi", { usePlaceholderTokens: true }),
    },
    {
      category: "Adres ve Konum",
      key: "environmental_agricultural_template",
      title: "Çevresel Özellikler - Tarımsal Alan Şablonu",
      value: buildEnvironmentalDescription("Tarımsal Alan", { usePlaceholderTokens: true }),
    },
    {
      category: "Takyidat",
      key: "encumbrance_summary_text",
      title: "Takyidat Paragrafı",
      value: buildEncumbranceSummary(),
    },
    {
      category: "İmar Durumu",
      key: "planning_note_text",
      title: "İmar Açıklaması",
      value: buildImarPlanningNote(),
    },
    {
      category: "İmar Durumu",
      key: "calculated_emsal_text",
      title: "Hesaplanan Emsal",
      value: buildImarCalculatedEmsal(),
    },
    {
      category: "Belgeler ve Proje",
      key: "reviewed_documents_text",
      title: "İncelenen Belgeler Açıklaması",
      value: buildReviewedDocumentsDescription(),
    },
    {
      category: "Ana Gayrimenkul Özellikleri",
      key: "building_floor_summary_text",
      title: "Kat Dağılımı Özeti",
      value: buildBuildingFloorMacroSummary(),
    },
    {
      category: "Ana Gayrimenkul Özellikleri",
      key: "main_property_description_text",
      title: "Ana Gayrimenkul Açıklaması",
      value: buildMainPropertyDescription(),
    },
    {
      category: "Bağımsız Bölüm Özellikleri",
      key: "unit_interior_description_text",
      title: "Kat, Alan ve İç Hacimler Açıklaması",
      value: composeUnitInteriorDescription(),
    },
    {
      category: "Bağımsız Bölüm Özellikleri",
      key: "unit_decorative_description_text",
      title: "Dekoratif Özellikler Açıklaması",
      value: composeUnitDecorativeDescription(),
    },
  ];

  return generatedRows.map((row) => ({
    category: row.category,
    token: makePlaceholderToken(row.key),
    title: row.title,
    type: "Oluşturulan Metin",
    source: "Otomatik Cümle",
    value: formatPlaceholderValue(row.value),
    reference: row.key,
  }));
}

function collectTablePlaceholders() {
  const rows = [];
  Object.entries(state.tables || {}).forEach(([key, tableRows]) => {
    const usedRows = Array.isArray(tableRows)
      ? tableRows.filter((row) => Object.values(row || {}).some(Boolean)).length
      : 0;
    rows.push({
      category: "Tablolar",
      token: makePlaceholderToken(`table_${key}`),
      title: formatTablePlaceholderTitle(key),
      type: "Tablo",
      source: "Uygulama Tablosu",
      value: usedRows ? `${usedRows} dolu satır` : "",
      reference: key,
    });
  });
  return rows;
}

function collectLegacyExcelPlaceholders() {
  return (legacyPlaceholderRows || []).map((row) => ({
    category: `Excel Kaynağı / ${row.sheet || "Genel"}`,
    token: row.name || "",
    title: row.name || "",
    type: row.type || "Adlandırılmış Hücre",
    source: "Excel Kaynağı",
    value: formatPlaceholderValue(row.value),
    reference: row.reference || row.range || "",
  }));
}

function makePlaceholderToken(key) {
  return `{{${toPlaceholderName(key)}}}`;
}

function toPlaceholderName(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLocaleUpperCase("tr-TR");
}

function getPlaceholderFieldTypeLabel(field = {}) {
  const labels = {
    text: "Metin",
    textarea: "Uzun Metin",
    select: "Seçim Listesi",
    date: "Tarih",
    time: "Saat",
    number: "Sayı",
    multiCheckbox: "Çoklu Seçim",
    conditionalYesNo: "Koşullu Seçim",
    titleRecordChange: "Koşullu Seçim",
    artery: "Ulaşım Ana Arteri",
  };
  return labels[field.type] || field.type || "Alan";
}

function formatTablePlaceholderTitle(key) {
  const known = {
    title: "Malikler",
    encumbranceStatements: "Beyanlar - Hak ve Mükellefiyetler",
    encumbranceAnnotations: "Şerhler",
    encumbranceMortgages: "İpotekler",
    documents: "İncelenen Belgeler",
    comparables: "Emsaller",
    buildingFloors: "Ana Gayrimenkul Kat Satırları",
    unitFloors: "Bağımsız Bölüm Kat Satırları",
  };
  return known[key] || key;
}

function formatPlaceholderValue(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replace(/_x000D_/g, "").trim();
}

function normalizeSearchText(value) {
  return String(value || "").toLocaleLowerCase("tr-TR");
}

function createEncumbranceReportTables() {
  hydrateEncumbranceReportTablesFromLegacy();
  const wrapper = document.createElement("div");
  wrapper.className = "encumbrance-report-groups";
  encumbranceReportTables.forEach((table) => {
    wrapper.append(createTable({
      id: table.key,
      table: {
        title: table.title,
        columns: table.columns || encumbranceReportColumns,
        rows: encumbranceEmptyRowCount,
      },
    }));
  });
  return wrapper;
}

function hydrateEncumbranceReportTablesFromLegacy() {
  const hasGroupedRows = encumbranceReportTables.some((table) =>
    (state.tables[table.key] || []).some((row) => Object.values(row || {}).some(Boolean)),
  );
  if (hasGroupedRows) return;

  const legacyRows = state.tables.encumbrance || [];
  const records = legacyRows
    .filter((row) => Object.values(row || {}).some(Boolean))
    .map((row) => ({
      type: row.c0 || "",
      description: row.c1 || "",
      date: row.c2 || "",
      journalNo: row.c3 || "",
    }));
  if (records.length) {
    applyTakbisEncumbrancesToTable(records);
  }
}

const comparableDefaultRowCount = 4;
const comparablePercentOptions = Array.from({ length: 21 }, (_, index) => `${index * 5}%`);
const comparableFloorOptions = [
  "Bahçe Dubleks",
  "Bodrum kat",
  "Zemin kat",
  "Asma kat",
  "Ara kat",
  "En üst kat",
  ...Array.from({ length: 30 }, (_, index) => `${index + 1}. normal kat`),
  "Çatı kat",
  "Çatı Dubleks",
  "Teras kat",
];
const comparableFields = [
  { key: "c0", label: "İrtibat / Kaynak" },
  { key: "c1", label: "Telefon" },
  {
    key: "c2",
    label: "Emsal Durumu",
    type: "select",
    options: ["Konu taşınmaz", "Satılık", "Satılmış", "Kiralık", "Genel Beyan"],
  },
  { key: "c3", label: "Satış Zamanı", type: "date" },
  {
    key: "c4",
    label: "Nitelik",
    type: "select",
    options: ["daire", "dubleks daire", "tripleks daire", "ofis", "dubleks ofis", "tripleks ofis", "işyeri", "dubleks işyeri", "3 katlı işyeri", "4 katlı işyeri", "villa", "dubleks villa", "tripleks villa"],
  },
  {
    key: "c5",
    label: "Oda Sayısı",
    type: "select",
    options: ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "6+1"],
  },
  {
    key: "c6",
    label: "Bulunduğu Kat / Mülkiyet",
    type: "multiSelect",
    options: comparableFloorOptions,
  },
  {
    key: "c7",
    label: "Emsal Konumu",
    type: "select",
    options: ["Aynı bölge / site", "Aynı bölge / bina", "Aynı cadde / site", "Aynı cadde / bina", "Aynı sokak / site", "Aynı sokak / bina", "Aynı site", "Aynı site aynı blok", "Aynı bina"],
  },
  {
    key: "c8",
    label: "İç Özellikler",
    type: "select",
    options: ["+", "-", "0"],
    percentKey: "c21",
  },
  {
    key: "c21",
    label: "Özellik Şerefiye Oranı",
    type: "select",
    options: comparablePercentOptions,
    hidden: true,
  },
  {
    key: "c9",
    label: "Taşınmaza Göre Konum",
    type: "select",
    options: ["+", "-", "0"],
    percentKey: "c22",
  },
  {
    key: "c22",
    label: "Konum Şerefiye Oranı",
    type: "select",
    options: comparablePercentOptions,
    hidden: true,
  },
  { key: "c10", label: "Konum Karşılaştırma Sebebi", type: "textarea", wide: true },
  {
    key: "c11",
    label: "Bulunduğu Yapı Yaşı",
    type: "select",
    options: ["Yeni", "1-2", "3-4", "5-6", "7-8", "8-9", "10-15", "15-20", "20-25", "25-30", "30-35", "35-40", "40 üzeri"],
  },
  { key: "c12", label: "Beyan Edilen Alan" },
  { key: "c13", label: "Düzeltilmiş Alan" },
  { key: "c14", label: "İstenen Fiyat" },
  { key: "c15", label: "Pazarlıklı Fiyat" },
  { key: "calcNegotiation", label: "Pazarlık Payı", computed: true },
  { key: "calcUnitValue", label: "M2 Birim Değer", computed: true },
  { key: "calcFeatureAdjustment", label: "Özellik Şerefiyesi", computed: true, hidden: true },
  { key: "calcLocationAdjustment", label: "Konum Şerefiyesi", computed: true, hidden: true },
  { key: "calcAdjustedUnitValue", label: "İndirgenmiş M2 Birim Değer", computed: true },
  { key: "c16", label: "Kira Değeri" },
  { key: "calcRentUnitValue", label: "Kira Birim Değer", computed: true },
  { key: "c17", label: "Açıklama / Düzeltme", type: "textarea", wide: true },
  { key: "calcShortText", label: "Kısa Emsal Metni", computed: true, type: "textarea", wide: true },
  { key: "calcLongText", label: "Uzun Emsal Metni", computed: true, type: "textarea", wide: true },
];

function createComparablesVerticalEditor(section) {
  const wrapper = document.createElement("div");
  wrapper.className = "subsection is-detail comparables-excel-editor";

  const headingRow = document.createElement("div");
  headingRow.className = "subsection-table-head";
  headingRow.innerHTML = `<h4>${formatUiHeading(section.table.title)}</h4>`;

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "mini-button";
  addButton.textContent = "Emsal ekle";
  addButton.addEventListener("click", () => {
    getComparableRows().push({ _comparablesVersion: 2 });
    autosave();
    renderSection();
  });
  headingRow.append(addButton);

  const rows = getComparableRows();

  if (!rows.length) {
    const emptyLine = document.createElement("div");
    emptyLine.className = "encumbrance-empty-line";
    emptyLine.textContent = "Henüz emsal eklenmedi. Yeni kayıt için Emsal ekle düğmesini kullanın.";
    wrapper.append(headingRow, emptyLine, createComparableLocationSketchPanel());
    return wrapper;
  }

  const shell = document.createElement("div");
  shell.className = "table-shell comparables-matrix-shell";
  const table = document.createElement("table");
  table.className = "comparables-matrix-table";

  const thead = document.createElement("thead");
  const headerCells = rows.map((row, rowIndex) => `
    <th>
      <div class="comparable-column-head">
        <span>Emsal ${rowIndex + 1}</span>
        <div class="comparable-column-actions">
          <button type="button" class="mini-button comparable-copy-button" data-comparable-copy="${rowIndex}" aria-label="Emsali sonraki sütuna kopyala">Kopyala</button>
          <button type="button" class="mini-button comparable-reset-button" data-comparable-reset="${rowIndex}" aria-label="Emsali temizle">Reset</button>
          <button type="button" class="row-delete-button" data-comparable-delete="${rowIndex}" aria-label="Emsali sil">X</button>
        </div>
      </div>
    </th>
  `).join("");
  thead.innerHTML = `<tr><th class="comparables-row-label-cell">Sıra No</th>${headerCells}</tr>`;

  const tbody = document.createElement("tbody");
  comparableFields.filter((field) => !field.hidden).forEach((field) => {
    const tr = document.createElement("tr");
    if (field.key === "c10") tr.dataset.comparableReasonRow = "true";
    const labelCell = document.createElement("th");
    labelCell.className = "comparables-row-label-cell";
    labelCell.textContent = formatUiHeading(field.label);
    tr.append(labelCell);

    rows.forEach((row, rowIndex) => {
      const td = document.createElement("td");
      td.append(createComparableMatrixCell(section, field, row, rowIndex));
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  shell.append(table);
  updateComparableReasonRowsVisibility(shell);
  shell.querySelectorAll("[data-comparable-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const rowIndex = Number(button.dataset.comparableDelete);
      getComparableRows().splice(rowIndex, 1);
      autosave();
      renderSection();
    });
  });
  shell.querySelectorAll("[data-comparable-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      const rowIndex = Number(button.dataset.comparableReset);
      getComparableRows()[rowIndex] = { _comparablesVersion: 2 };
      autosave();
      renderSection();
    });
  });
  shell.querySelectorAll("[data-comparable-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const rowIndex = Number(button.dataset.comparableCopy);
      const rows = getComparableRows();
      if (!rows[rowIndex]) return;
      if (!rows[rowIndex + 1]) rows.push({ _comparablesVersion: 2 });
      rows[rowIndex + 1] = cloneComparableRow(rows[rowIndex]);
      autosave();
      renderSection();
    });
  });

  wrapper.append(headingRow, shell, createComparableLocationSketchPanel());
  return wrapper;
}

function createComparableLocationSketchPanel() {
  const wrapper = document.createElement("div");
  wrapper.className = "subsection is-detail comparable-location-sketch";
  wrapper.innerHTML = `
    <div class="subsection-table-head">
      <h4>Emsal Konum Krokisi</h4>
    </div>
    <p class="subtle-text">Konu taşınmaz ve haritadan işaretlenen emsaller aynı kroki üzerinde gösterilir.</p>
    <div class="comparable-sketch-toolbar">
      <label class="export-control">
        <span>Harita</span>
        <select data-comparable-sketch-map-mode>
          ${getMapModeOptionsMarkup()}
        </select>
      </label>
      <button class="mini-button" type="button" data-comparable-sketch-export>EMSAL KROKİSİNİ JPEG OLARAK KAYDET</button>
      <label class="export-control">
        <span>Boyut</span>
        <select data-comparable-sketch-export-ratio>
          ${getMapExportRatioOptionsMarkup()}
        </select>
      </label>
      <span class="export-status" data-comparable-sketch-export-status aria-live="polite"></span>
    </div>
    <div class="comparable-location-sketch-map" data-comparable-location-sketch-map></div>
  `;
  wrapper.querySelector("[data-comparable-sketch-map-mode]").addEventListener("change", (event) => {
    state.settings.mapMode = normalizeMapMode(event.target.value);
    autosave();
    renderComparableLocationSketchMap(wrapper);
  });
  wrapper.querySelector("[data-comparable-sketch-export-ratio]").addEventListener("change", (event) => {
    state.settings.mapExportRatio = event.target.value;
    autosave();
  });
  wrapper.querySelector("[data-comparable-sketch-export]").addEventListener("click", (event) => {
    exportComparableSketchAsJpeg(wrapper, event.currentTarget);
  });
  window.setTimeout(() => renderComparableLocationSketchMap(wrapper), 0);
  return wrapper;
}

function renderComparableLocationSketchMap(wrapper) {
  const panel = wrapper.querySelector("[data-comparable-location-sketch-map]");
  if (!panel) return;

  const subjectPoint = getComparableSubjectPoint();
  const comparablePoints = getComparableSketchPoints();
  if (!isLeafletReady()) {
    panel.innerHTML = `<div class="map-placeholder">Harita kütüphanesi yüklenemedi.</div>`;
    return;
  }
  if (!subjectPoint) {
    panel.innerHTML = `<div class="map-placeholder">Kroki için önce Adres ve Konum bölümünde taşınmaz konumu işaretlenmeli.</div>`;
    return;
  }

  if (wrapper._comparableSketchMap?.remove) {
    wrapper._comparableSketchMap.remove();
    wrapper._comparableSketchMap = null;
  }
  panel.innerHTML = "";
  const leaflet = window.L;
  const map = leaflet.map(panel, {
    scrollWheelZoom: false,
  }).setView(subjectPoint, 15);
  wrapper._comparableSketchMap = map;
  getLeafletTileLayer().addTo(map);

  const coordinates = state.sourceValues.kml?.coordinates || [];
  if (coordinates.length) {
    leaflet.polygon(coordinates.map((point) => [point.lat, point.lng]), {
      color: "#d92525",
      weight: 3,
      opacity: 0.95,
      fillColor: "#d92525",
      fillOpacity: 0.12,
    }).addTo(map);
  }

  const boundsPoints = [subjectPoint];
  leaflet.marker(subjectPoint).addTo(map).bindTooltip("KONU TAŞINMAZ", {
    permanent: true,
    direction: "top",
    offset: [0, -12],
    className: "subject-map-label",
  });

  comparablePoints.forEach((item) => {
    boundsPoints.push(item.point);
    leaflet.polyline([subjectPoint, item.point], {
      color: "#0f766e",
      weight: 2,
      opacity: 0.65,
      dashArray: "6 6",
    }).addTo(map);
    leaflet.circleMarker(item.point, {
      radius: 8,
      color: "#0f766e",
      weight: 2,
      fillColor: "#14b8a6",
      fillOpacity: 0.95,
    }).addTo(map).bindTooltip(`Emsal ${item.index + 1}`, {
      permanent: true,
      direction: "top",
      offset: [0, -10],
      className: "comparable-map-label",
    });
  });

  if (!comparablePoints.length) {
    const notice = leaflet.control({ position: "bottomleft" });
    notice.onAdd = () => {
      const div = leaflet.DomUtil.create("div", "comparable-sketch-notice");
      div.textContent = "Haritadan işaretlenmiş emsal konumu yok.";
      return div;
    };
    notice.addTo(map);
  }

  if (boundsPoints.length > 1) {
    map.fitBounds(leaflet.latLngBounds(boundsPoints), {
      padding: [42, 42],
      maxZoom: 17,
    });
  }
  window.setTimeout(() => map.invalidateSize(), 0);
}

function getComparableSketchPoints() {
  return getComparableRows()
    .map((row, index) => ({ row, index, point: getComparableSavedPoint(row) }))
    .filter((item) => Array.isArray(item.point));
}

async function exportComparableSketchAsJpeg(wrapper, triggerButton) {
  const subjectPoint = getComparableSubjectPoint();
  const comparablePoints = getComparableSketchPoints();
  const parsed = state.sourceValues.kml;
  if (!subjectPoint && !comparablePoints.length && !parsed?.coordinates?.length) {
    window.alert("Emsal krokisi kaydı için önce taşınmaz veya emsal konumu gerekiyor.");
    return;
  }

  const originalButtonText = triggerButton?.textContent;
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.textContent = "JPEG HAZIRLANIYOR...";
  }
  setComparableSketchExportStatus(wrapper, "Emsal krokisi JPEG kaydı hazırlanıyor...");

  const canvas = document.createElement("canvas");
  const exportSize = getMapExportCanvasSize();
  canvas.width = exportSize.width;
  canvas.height = exportSize.height;
  const context = canvas.getContext("2d");
  const center = getComparableSketchExportCenter(wrapper, subjectPoint, comparablePoints, parsed);
  const zoom = getComparableSketchExportZoom(wrapper, center, subjectPoint, comparablePoints, parsed, canvas.width, canvas.height);
  const topLeft = latLngToWorldPixel(center[0], center[1], zoom);
  topLeft.x -= canvas.width / 2;
  topLeft.y -= canvas.height / 2;

  context.fillStyle = normalizeMapMode(state.settings.mapMode) === "street" ? "#eef2ef" : "#d8e2df";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await drawExportTiles(context, canvas, topLeft, zoom, "base");
  await drawExportTiles(context, canvas, topLeft, zoom, "labels");
  drawExportKmlPolygon(context, parsed, topLeft, zoom);
  drawExportComparableSketch(context, subjectPoint, comparablePoints, topLeft, zoom);

  try {
    const link = document.createElement("a");
    link.download = `emsal-konum-krokisi-${new Date().toISOString().slice(0, 10)}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setComparableSketchExportStatus(wrapper, "JPEG kaydedildi.");
  } catch (error) {
    try {
      drawExportFallbackBase(context, canvas);
      drawExportKmlPolygon(context, parsed, topLeft, zoom);
      drawExportComparableSketch(context, subjectPoint, comparablePoints, topLeft, zoom);
      const fallbackLink = document.createElement("a");
      fallbackLink.download = `emsal-konum-krokisi-${new Date().toISOString().slice(0, 10)}.jpg`;
      fallbackLink.href = canvas.toDataURL("image/jpeg", 0.92);
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      fallbackLink.remove();
      setComparableSketchExportStatus(wrapper, "Harita altlığı izin vermedi; yedek JPEG kaydedildi.", true);
    } catch (fallbackError) {
      console.warn("Emsal krokisi JPEG olarak kaydedilemedi.", fallbackError);
      setComparableSketchExportStatus(wrapper, "JPEG kaydedilemedi. Haritayı yenileyip tekrar deneyin.", true);
      window.alert("Emsal krokisi JPEG olarak kaydedilemedi. Harita altlığı bu işlem için izin vermedi.");
    }
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = originalButtonText || "EMSAL KROKİSİNİ JPEG OLARAK KAYDET";
    }
  }
}

function setComparableSketchExportStatus(wrapper, message, isWarning = false) {
  const status = wrapper?.querySelector("[data-comparable-sketch-export-status]");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-warning", Boolean(isWarning));
}

function getComparableSketchExportCenter(wrapper, subjectPoint, comparablePoints, parsed) {
  const mapCenter = wrapper?._comparableSketchMap?.getCenter?.();
  if (mapCenter) return [mapCenter.lat, mapCenter.lng];
  const points = getComparableSketchExportPoints(subjectPoint, comparablePoints, parsed);
  if (!points.length) return [40.1826, 29.0665];
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
}

function getComparableSketchExportZoom(wrapper, center, subjectPoint, comparablePoints, parsed, canvasWidth, canvasHeight) {
  const mapZoom = wrapper?._comparableSketchMap?.getZoom?.();
  if (Number.isFinite(mapZoom)) return mapZoom;
  const points = getComparableSketchExportPoints(subjectPoint, comparablePoints, parsed);
  if (points.length < 2) return 16;

  for (let zoom = 18; zoom >= 9; zoom -= 1) {
    const projected = points.map(([lat, lng]) => latLngToWorldPixel(lat, lng, zoom));
    const width = Math.max(...projected.map((point) => point.x)) - Math.min(...projected.map((point) => point.x));
    const height = Math.max(...projected.map((point) => point.y)) - Math.min(...projected.map((point) => point.y));
    if (width <= canvasWidth * 0.82 && height <= canvasHeight * 0.76) return zoom;
  }
  return 9;
}

function getComparableSketchExportPoints(subjectPoint, comparablePoints, parsed) {
  return [
    ...(parsed?.coordinates || []).map((point) => [Number(point.lat), Number(point.lng)]),
    ...(subjectPoint ? [subjectPoint] : []),
    ...comparablePoints.map((item) => item.point),
  ].filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
}

function drawExportComparableSketch(context, subjectPoint, comparablePoints, topLeft, zoom) {
  const subjectPixel = subjectPoint ? projectExportPoint(subjectPoint[0], subjectPoint[1], topLeft, zoom) : null;
  if (subjectPoint) {
    drawExportSubject(context, subjectPoint, topLeft, zoom);
  }

  comparablePoints.forEach((item) => {
    const pixel = projectExportPoint(item.point[0], item.point[1], topLeft, zoom);
    if (subjectPixel) {
      context.save();
      context.strokeStyle = "rgba(15, 118, 110, 0.72)";
      context.lineWidth = 4;
      context.setLineDash([14, 12]);
      context.beginPath();
      context.moveTo(subjectPixel.x, subjectPixel.y);
      context.lineTo(pixel.x, pixel.y);
      context.stroke();
      context.restore();
    }
    drawExportPointLabel(context, pixel.x, pixel.y, `Emsal ${item.index + 1}`, "#0f766e");
  });
}

function cloneComparableRow(row) {
  const clone = {};
  comparableFields.forEach((field) => {
    if (field.computed) return;
    if (Object.prototype.hasOwnProperty.call(row, field.key)) {
      clone[field.key] = row[field.key];
    }
  });
  clone._comparablesVersion = 2;
  return clone;
}

function getComparableRows() {
  let rows = state.tables.comparables;
  if (!Array.isArray(rows)) {
    rows = Array.from({ length: comparableDefaultRowCount }, () => ({ _comparablesVersion: 2 }));
  }
  rows = rows.map(migrateComparableRow);
  rows = trimEmptyDefaultComparableRows(rows);
  state.tables.comparables = rows;
  return rows;
}

function trimEmptyDefaultComparableRows(rows) {
  if (rows.length <= comparableDefaultRowCount) return rows;
  const trimmedRows = [...rows];
  while (
    trimmedRows.length > comparableDefaultRowCount
    && isComparableRowEmpty(trimmedRows[trimmedRows.length - 1])
  ) {
    trimmedRows.pop();
  }
  return trimmedRows;
}

function isComparableRowEmpty(row = {}) {
  return comparableFields
    .filter((field) => !field.computed)
    .every((field) => !String(row[field.key] || "").trim());
}

function migrateComparableRow(row = {}) {
  if (row._comparablesVersion === 2) return row;
  const hasExpandedComparableData = comparableFields
    .filter((field) => Number(field.key.slice(1)) > 4)
    .some((field) => String(row[field.key] || "").trim());
  if (hasExpandedComparableData) {
    return { ...row, _comparablesVersion: 2 };
  }
  return {
    c0: row.c0 || "",
    c7: row.c1 || "",
    c12: row.c2 || "",
    c13: row.c2 || "",
    c15: row.c3 || "",
    c17: row.c4 || "",
    _comparablesVersion: 2,
  };
}

function createComparableMatrixCell(section, field, row, rowIndex) {
  const cell = document.createElement("div");
  cell.className = `comparable-matrix-cell${field.key === "c7" ? " comparable-location-cell" : ""}`;
  if (field.computed) {
    const computed = createComparableComputedControl(field, row, rowIndex);
    cell.append(computed);
    return cell;
  }
  if (field.type === "multiSelect") {
    cell.append(createComparableMultiSelectControl(field, row, rowIndex));
    return cell;
  }
  const control = createComparableFieldControl(field);
  const currentValue = row[field.key] || "";
  if (control.tagName === "SELECT" && currentValue && !Array.from(control.options).some((option) => option.value === currentValue)) {
    const currentOption = document.createElement("option");
    currentOption.value = currentValue;
    currentOption.textContent = currentValue;
    control.append(currentOption);
  }
  control.value = field.type === "date" ? toComparableDateInputValue(currentValue) : currentValue;
  control.addEventListener("input", (event) => {
    row[field.key] = event.target.value;
    autosave();
    refreshComparableComputedCells(row, rowIndex);
    updateComparableReasonRowsVisibility(cell.closest(".comparables-matrix-shell"));
  });
  control.addEventListener("change", (event) => {
    row[field.key] = event.target.value;
    autosave();
    refreshComparableComputedCells(row, rowIndex);
    updateComparableReasonRowsVisibility(cell.closest(".comparables-matrix-shell"));
  });
  control.addEventListener("blur", () => {
    if (control.tagName === "SELECT" || field.type === "date") return;
    const formattedValue = normalizeReportTableValue(section, field.label, control.value);
    if (formattedValue === control.value) return;
    control.value = formattedValue;
    row[field.key] = formattedValue;
    autosave();
    refreshComparableComputedCells(row, rowIndex);
  });
  cell.append(control);

  if (field.percentKey) {
    const percentControl = createComparableFieldControl({
      key: field.percentKey,
      label: `${field.label} Şerefiye Oranı`,
      type: "select",
      options: comparablePercentOptions,
    });
    percentControl.value = row[field.percentKey] || "";
    percentControl.addEventListener("input", (event) => {
      row[field.percentKey] = event.target.value;
      autosave();
      refreshComparableComputedCells(row, rowIndex);
      updateComparableReasonRowsVisibility(cell.closest(".comparables-matrix-shell"));
    });
    percentControl.addEventListener("change", (event) => {
      row[field.percentKey] = event.target.value;
      autosave();
      refreshComparableComputedCells(row, rowIndex);
      updateComparableReasonRowsVisibility(cell.closest(".comparables-matrix-shell"));
    });
    cell.append(percentControl);
    cell.classList.add("comparable-split-cell");
  }

  if (field.key === "c7") {
    const mapButton = document.createElement("button");
    mapButton.type = "button";
    mapButton.className = "mini-button comparable-map-button";
    mapButton.textContent = "Haritadan seç";
    mapButton.addEventListener("click", () => {
      openComparableLocationModal(row, rowIndex, () => {
        autosave();
        renderSection();
      });
    });
    const locationText = document.createElement("small");
    locationText.className = "conditional-summary";
    locationText.textContent = row.c20 || (row.c18 && row.c19 ? `${row.c18}, ${row.c19}` : "");
    cell.append(mapButton, locationText);
    cell.classList.add("comparable-location-split-cell");
  }

  return cell;
}

function createComparableMultiSelectControl(field, row, rowIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "multi-checkbox-dropdown comparable-multi-checkbox";
  const selected = getComparableMultiValues(row[field.key], field.options);
  const summaryButton = document.createElement("button");
  summaryButton.type = "button";
  summaryButton.className = "multi-checkbox-summary";
  summaryButton.setAttribute("aria-expanded", "false");
  summaryButton.textContent = selected.length ? selected.join(", ") : "Seçiniz";

  const list = document.createElement("div");
  list.className = "inline-checkbox-list";
  list.hidden = true;

  (field.options || []).forEach((option) => {
    const item = document.createElement("label");
    item.className = "checkbox-row";
    item.innerHTML = `
      <input type="checkbox" value="${escapeHtml(option)}" ${selected.includes(option) ? "checked" : ""}>
      <span>${escapeHtml(option)}</span>
    `;
    list.append(item);
  });

  const syncValue = () => {
    const values = [...list.querySelectorAll("input[type='checkbox']:checked")].map((checkbox) => checkbox.value);
    const targetRow = getComparableRows()[rowIndex] || row;
    targetRow[field.key] = values.join(", ");
    row[field.key] = targetRow[field.key];
    summaryButton.textContent = values.length ? values.join(", ") : "Seçiniz";
    autosave();
    refreshComparableComputedCells(targetRow, rowIndex);
  };

  list.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", syncValue);
  });

  let outsideClickListener = null;
  const setOpen = (isOpen) => {
    list.hidden = !isOpen;
    wrapper.classList.toggle("is-open", isOpen);
    summaryButton.setAttribute("aria-expanded", String(isOpen));
    if (outsideClickListener) {
      document.removeEventListener("pointerdown", outsideClickListener);
      outsideClickListener = null;
    }
    if (isOpen) {
      outsideClickListener = (event) => {
        if (!wrapper.contains(event.target)) setOpen(false);
      };
      const currentOutsideClickListener = outsideClickListener;
      setTimeout(() => {
        if (outsideClickListener === currentOutsideClickListener) {
          document.addEventListener("pointerdown", currentOutsideClickListener);
        }
      }, 0);
    }
  };

  summaryButton.addEventListener("click", () => {
    setOpen(list.hidden);
  });
  list.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  wrapper.append(summaryButton, list);
  return wrapper;
}

function getComparableMultiValues(value, options = []) {
  const allowed = new Set(options);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && allowed.has(item));
}

function updateComparableReasonRowsVisibility(scope = document) {
  const rows = getComparableRows();
  const shouldShow = rows.some((row) => {
    const sign = String(row.c9 || "").trim();
    return sign === "+" || sign === "-";
  });
  scope?.querySelectorAll?.("[data-comparable-reason-row]").forEach((rowElement) => {
    rowElement.hidden = !shouldShow;
  });
}

function createComparableComputedControl(field, row, rowIndex) {
  const value = calculateComparableFieldValue(field.key, row, rowIndex);
  const control = document.createElement(field.type === "textarea" ? "textarea" : "input");
  control.value = value;
  control.readOnly = true;
  control.className = "computed-input";
  control.dataset.comparableRow = String(rowIndex);
  control.dataset.comparableComputed = field.key;
  if (field.type === "textarea") {
    control.rows = field.key === "calcLongText" ? 4 : 3;
  }
  return control;
}

function refreshComparableComputedCells(row, rowIndex) {
  document.querySelectorAll(`[data-comparable-row="${rowIndex}"][data-comparable-computed]`).forEach((control) => {
    control.value = calculateComparableFieldValue(control.dataset.comparableComputed, row, rowIndex);
  });
}

function calculateComparableFieldValue(key, row, rowIndex = 0) {
  const metrics = calculateComparableMetrics(row);
  if (key === "calcNegotiation") return formatComparablePercent(metrics.negotiationRate);
  if (key === "calcUnitValue") return formatComparableMoney(metrics.unitValue, " TL/m²");
  if (key === "calcFeatureAdjustment") return formatComparableSignedPercent(metrics.featureAdjustment);
  if (key === "calcLocationAdjustment") return formatComparableSignedPercent(metrics.locationAdjustment);
  if (key === "calcAdjustedUnitValue") return formatComparableMoney(metrics.adjustedUnitValue, " TL/m²");
  if (key === "calcRentUnitValue") return formatComparableMoney(metrics.rentUnitValue, " TL/m²/ay");
  if (key === "calcShortText") return buildComparableShortText(row, rowIndex, metrics);
  if (key === "calcLongText") return buildComparableLongText(row, rowIndex, metrics);
  return "";
}

function calculateComparableMetrics(row) {
  const status = String(row.c2 || "").toLocaleLowerCase("tr-TR");
  const askingPrice = parseComparableNumber(row.c14);
  const bargainPrice = parseComparableNumber(row.c15);
  const adjustedArea = parseComparableNumber(row.c13 || row.c12);
  const rent = parseComparableNumber(row.c16);
  const featureAdjustment = calculateComparableAdjustment(row.c8, row.c21);
  const locationAdjustment = calculateComparableAdjustment(row.c9, row.c22);
  const negotiationRate = askingPrice > 0 && bargainPrice > 0 ? 1 - bargainPrice / askingPrice : Number.NaN;
  const saleValue = status.includes("satılmış")
    ? askingPrice
    : bargainPrice > 0
      ? bargainPrice
      : askingPrice;
  const unitValue = saleValue > 0 && adjustedArea > 0 ? saleValue / adjustedArea : Number.NaN;
  const adjustedUnitValue = Number.isFinite(unitValue) ? unitValue * (1 + featureAdjustment + locationAdjustment) : Number.NaN;
  const rentUnitValue = rent > 0 && adjustedArea > 0 ? rent / adjustedArea : Number.NaN;
  return {
    askingPrice,
    bargainPrice,
    saleValue,
    adjustedArea,
    rent,
    featureAdjustment,
    locationAdjustment,
    negotiationRate,
    unitValue,
    adjustedUnitValue,
    rentUnitValue,
  };
}

function calculateComparableAdjustment(direction, percentValue) {
  const percent = parseComparablePercent(percentValue);
  const sign = String(direction || "").trim();
  if (!Number.isFinite(percent) || !sign || sign === "0") return 0;
  if (sign === "+") return -percent;
  if (sign === "-") return percent;
  return 0;
}

function parseComparableNumber(value) {
  const text = String(value || "")
    .replace(/\b(?:TL|TRY|m2|m²|%|\/ay)\b/gi, "")
    .replace(/[₺\s]/g, "")
    .trim();
  if (!text) return Number.NaN;
  const normalized = text.includes(",") && text.includes(".")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(",", ".");
  const number = Number.parseFloat(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : Number.NaN;
}

function parseComparablePercent(value) {
  const number = parseComparableNumber(value);
  if (!Number.isFinite(number)) return Number.NaN;
  return number > 1 ? number / 100 : number;
}

function formatComparableMoney(value, suffix = " TL") {
  if (!Number.isFinite(value)) return "";
  return `${Math.round(value).toLocaleString("tr-TR")}${suffix}`;
}

function formatComparablePercent(value) {
  if (!Number.isFinite(value)) return "";
  return `%${(value * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function formatComparableSignedPercent(value) {
  if (!Number.isFinite(value) || value === 0) return "%0";
  const sign = value > 0 ? "+" : "-";
  return `${sign}%${(Math.abs(value) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function buildComparableShortText(row, rowIndex, metrics) {
  const longText = buildComparableLongText(row, rowIndex, metrics);
  if (!longText) return "";
  const firstParagraph = longText.split(/\n\s*\n/).pop() || longText;
  return normalizeReportSentenceLine(firstParagraph.replace(/\s*\(İndirgenmiş m2 Birim Değeri:[^)]+\)/i, ""));
}

function buildComparableLongText(row, rowIndex, metrics) {
  if (!String(row.c0 || row.c2 || row.c4 || "").trim()) return "";
  const status = String(row.c2 || "").toLocaleLowerCase("tr-TR");
  if (status.includes("genel")) return buildComparableGeneralStatement(row, metrics);
  if (status.includes("konu")) return buildComparableSubjectStatement(row, metrics);

  const contactLine = buildComparableContactLine(row);
  const location = buildComparableLocationLocative(row.c7);
  const age = buildComparableBuildingAgePhrase(row);
  const floor = buildComparableFloorPhrase(row.c6);
  const declaredArea = formatComparableArea(row.c12, "m2");
  const correctedArea = formatComparableArea(row.c13 || row.c12, "m2");
  const statusText = getComparableStatusText(row, metrics);
  const positionText = buildComparablePositionComparisonText(row);
  const featureText = buildComparableFeatureComparisonText(row).replace(/^Emsal,\s*/i, "");
  const bargainRentText = buildComparableBargainAndRentText(row, metrics);
  const calculationText = buildComparableCalculationText(row, metrics);
  const extraText = formatComparableExtraNote(row.c17);
  const sentence = [
    "Ekspertize konu taşınmazla ",
    location,
    age ? `, ${age}` : "",
    floor ? `, ${floor}` : "",
    declaredArea ? `, ${declaredArea} olarak beyan edilen` : "",
    correctedArea ? `, ${correctedArea} olduğu düşünülen` : "",
    row.c5 ? `, ${row.c5} planında` : "",
    row.c4 ? ` ${row.c4}` : "",
    statusText ? ` ${statusText}` : "",
    positionText || featureText ? ` Emsal, ${[positionText, featureText].filter(Boolean).join(" ve ")}.` : "",
    bargainRentText ? ` ${bargainRentText}` : "",
    extraText ? ` ${extraText}` : "",
    calculationText,
  ].join("");
  return normalizeComparableText(`${contactLine}\n\n${sentence}`);
}

function formatComparableExtraNote(value) {
  const text = String(value || "").trim();
  return text ? `(Not: ${text})` : "";
}

function buildComparableLocationPhrase(row) {
  const location = buildComparableLocationLocative(row.c7);
  const mapLocation = String(row.c20 || "").trim();
  if (location && mapLocation) return `${location}, taşınmaza göre ${mapLocation}`;
  if (location) return location;
  if (mapLocation) return `taşınmaza göre ${mapLocation}`;
  return "";
}

function buildComparableAgeFloorPhrase(row) {
  const parts = [];
  const age = buildComparableBuildingAgePhrase(row);
  const floor = buildComparableFloorPhrase(row.c6);
  if (age) parts.push(age);
  if (floor) parts.push(floor);
  if (row.c5) parts.push(`${row.c5} oda düzeninde`);
  return parts.join(", ");
}

function getComparableStatusText(row, metrics) {
  const status = String(row.c2 || "").toLocaleLowerCase("tr-TR");
  if (status.includes("konu")) return "";
  if (status.includes("kiralık")) {
    return metrics.rent > 0 ? `${formatComparableMoney(metrics.rent, " TL/ay")} bedelle kiralıktır.` : "kiralık olduğu bilgisi alınmıştır.";
  }
  if (status.includes("satılmış")) {
    const dateText = buildComparableSaleDateText(row.c3);
    return metrics.askingPrice > 0
      ? `${formatComparableMoney(metrics.askingPrice)} bedelle ${dateText} satıldığı bilgisi alınmıştır.`
      : `${dateText} satıldığı bilgisi alınmıştır.`;
  }
  if (status.includes("genel")) {
    return "";
  }
  if (metrics.askingPrice > 0) return `${formatComparableMoney(metrics.askingPrice)} bedelle satılıktır.`;
  return status ? `${status} olduğu bilgisi alınmıştır.` : "";
}

function buildComparablePositionComparisonText(row) {
  const sign = String(row.c9 || "").trim();
  const reason = row.c10 ? `${row.c10} sebebiyle ` : "";
  const percent = parseComparablePercent(row.c22);
  if (!Number.isFinite(percent) || percent === 0) {
    return reason ? `${row.c10} olmasına rağmen benzer konumda` : "benzer konumda";
  }
  if (sign === "+") return `${reason}taşınmaza göre ${percent > 0.25 ? "çok daha iyi" : "daha iyi"} konumda`;
  if (sign === "-") return `${reason}taşınmaza göre ${percent > 0.25 ? "çok daha vasat" : "daha vasat"} konumda`;
  return reason ? `${row.c10} olmasına rağmen benzer konumda` : "benzer konumda";
}

function buildComparableFeatureComparisonText(row) {
  const sign = String(row.c8 || "").trim();
  const percent = parseComparablePercent(row.c21);
  if (!Number.isFinite(percent) || percent === 0 || sign === "0") return "Emsal, konu taşınmaza göre benzer iç özelliklere sahiptir.";
  if (sign === "+") return `Emsal, konu taşınmaza göre ${percent > 0.25 ? "çok daha iyi" : "daha iyi"} iç özelliklere sahiptir.`;
  if (sign === "-") return `Emsal, konu taşınmaza göre ${percent > 0.25 ? "çok daha vasat" : "daha vasat"} iç özelliklere sahiptir.`;
  return "Emsal, konu taşınmaza göre benzer iç özelliklere sahiptir.";
}

function buildComparableContactLine(row) {
  return `(İrtibat Kişisi ve Telefon No: ${[row.c0, row.c1].filter(Boolean).join(" / ") || "-"})`;
}

function buildComparableSubjectStatement(row, metrics) {
  const contactLine = buildComparableContactLine(row);
  const declaredArea = formatComparableArea(row.c12, "m2");
  const correctedArea = formatComparableArea(row.c13 || row.c12, "m2");
  const priceText = metrics.askingPrice > 0
    ? `Taşınmaz için ${formatComparableMoney(metrics.askingPrice)} talep edilmektedir.`
    : "Taşınmaz için fiyat bilgisi paylaşılmamıştır.";
  const negotiationText = Number.isFinite(metrics.negotiationRate) && metrics.negotiationRate > 0
    ? `Pazarlık payı vardır. Pazarlık payının yaklaşık %${Math.round(metrics.negotiationRate * 100).toLocaleString("tr-TR")} olduğu düşünülmektedir.`
    : "Pazarlık payı yoktur.";
  const sentence = [
    "Ekspertize konu taşınmaz satılık olup",
    declaredArea ? `, ${declaredArea} olarak beyan edilmiş` : "",
    correctedArea ? `, ${correctedArea} olduğu bilinmektedir.` : ".",
    ` ${priceText}`,
    ` ${negotiationText}`,
  ].join("");
  return normalizeComparableText(`${contactLine}\n\n${sentence}`);
}

function buildComparableGeneralStatement(row, metrics) {
  const value = Number.isFinite(metrics.adjustedUnitValue) ? metrics.adjustedUnitValue : metrics.unitValue;
  const lower = Number.isFinite(value) ? roundComparableToNearest1000(value * 0.96) : Number.NaN;
  const upper = Number.isFinite(value) ? roundComparableToNearest1000(value * 1.04) : Number.NaN;
  const valueText = Number.isFinite(lower) && Number.isFinite(upper)
    ? `${formatComparableMoney(lower, " TL/m2")} ila ${formatComparableMoney(upper, " TL/m2")}`
    : "piyasa koşullarına göre değişen değerler";
  return normalizeComparableText(`${buildComparableSourceAblative(row.c0)} alınan sözlü bilgiye göre bölgede yer alan benzer özellikteki gayrimenkullerin m2 birim değerinin ${valueText} civarında olabileceği bilgisi alınmıştır.`);
}

function buildComparableBargainAndRentText(row, metrics) {
  const status = String(row.c2 || "").toLocaleLowerCase("tr-TR");
  if (status.includes("kiralık")) {
    const lower = metrics.bargainPrice > 0 ? formatComparableMoney(metrics.bargainPrice) : "";
    const upper = metrics.askingPrice > 0 ? formatComparableMoney(metrics.askingPrice) : "";
    if (!lower && !upper) return "";
    return `Bölgedeki kapitalizasyon oranı dikkate alındığında emsalin piyasa değerinin yaklaşık ${[lower, upper].filter(Boolean).join(" - ")} arasında olabileceği düşünülmektedir.`;
  }
  if (status.includes("genel")) return "";
  if (status.includes("satılmış")) {
    return metrics.rent > 0 ? `Kira değerinin ${formatComparableMoney(metrics.rent, " TL/ay")} olacağı düşünülmektedir.` : "";
  }
  const rentText = metrics.rent > 0 ? `Kira değerinin ${formatComparableMoney(metrics.rent, " TL/ay")} olacağı düşünülmektedir.` : "";
  if (Number.isFinite(metrics.negotiationRate) && metrics.negotiationRate > 0) {
    const negotiationRateText = Math.round(metrics.negotiationRate * 100).toLocaleString("tr-TR");
    return metrics.rent > 0
      ? `Pazarlık payı vardır. Pazarlık payının yaklaşık %${negotiationRateText}, kira değerinin ${formatComparableMoney(metrics.rent, " TL/ay")} olacağı düşünülmektedir.`
      : `Pazarlık payı vardır. Pazarlık payının yaklaşık %${negotiationRateText} olduğu düşünülmektedir.`;
  }
  return metrics.rent > 0
    ? `Pazarlık payı yoktur. Kira değerinin ${formatComparableMoney(metrics.rent, " TL/ay")} olacağı düşünülmektedir.`
    : "Pazarlık payı yoktur.";
}

function buildComparableCalculationText(row, metrics) {
  const status = String(row.c2 || "").toLocaleLowerCase("tr-TR");
  if (!status.includes("satılık") && !status.includes("satılmış")) return "";
  if (!Number.isFinite(metrics.adjustedUnitValue) || metrics.adjustedArea <= 0 || metrics.saleValue <= 0) return "";
  const totalAdjustment = 1 + metrics.featureAdjustment + metrics.locationAdjustment;
  const label = status.includes("satılmış") ? "Satış Değeri" : "Pazarlıklı Değer";
  return ` (İndirgenmiş m2 Birim Değeri: ${formatComparableMoney(metrics.saleValue)} (${label}) × ${totalAdjustment.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Toplam Şerefiye Katsayısı) / ${metrics.adjustedArea.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m2 = ${formatComparableMoney(metrics.adjustedUnitValue, " TL/m2")})`;
}

function buildComparableLocationLocative(value) {
  const key = String(value || "").trim().toLocaleLowerCase("tr-TR");
  if (["aynı bölge", "aynı bölge / site", "aynı bölge / bina"].includes(key)) return "aynı bölgede";
  if (["aynı cadde", "aynı cadde / site", "aynı cadde / bina"].includes(key)) return "aynı caddede";
  if (["aynı sokak", "aynı sokak / site", "aynı sokak / bina"].includes(key)) return "aynı sokakta";
  if (key === "aynı site") return "aynı sitede";
  if (key === "aynı site aynı blok") return "aynı sitede aynı blokta";
  if (key === "aynı bina") return "aynı binada";
  return key ? `${key} konumunda` : "aynı bölgede";
}

function buildComparableStructureLocative(value) {
  const key = String(value || "").trim().toLocaleLowerCase("tr-TR");
  if (["aynı bölge / site", "aynı cadde / site", "aynı sokak / site"].includes(key)) return "sitede";
  if (["aynı bölge / bina", "aynı cadde / bina", "aynı sokak / bina"].includes(key)) return "binada";
  return "";
}

function buildComparableBuildingAgePhrase(row) {
  const locationKey = String(row.c7 || "").trim().toLocaleLowerCase("tr-TR");
  if (["aynı site", "aynı site aynı blok", "aynı bina"].includes(locationKey)) return "";
  const structure = buildComparableStructureLocative(row.c7) || "binada";
  const age = String(row.c11 || "").replace(/\s*yaş$/i, "").trim();
  if (!age || age.toLocaleLowerCase("tr-TR") === "yeni") return `yeni bir ${structure} konumlu`;
  return `${age} yıllık bir ${structure} konumlu`;
}

function buildComparableFloorPhrase(value) {
  const parts = String(value || "")
    .split(",")
    .map((item) => normalizeComparableFloorName(item))
    .filter(Boolean);
  if (!parts.length) return "";
  return `${joinComparableTurkishList([...new Set(parts)])} katta yer alan`;
}

function normalizeComparableFloorName(value) {
  const text = String(value || "").trim();
  const key = text.toLocaleLowerCase("tr-TR");
  if (!key) return "";
  const normalMatch = key.match(/^(\d+)\.\s*normal/);
  if (normalMatch) return `${normalMatch[1]}. normal`;
  if (key.includes("bahçe")) return "bahçe dubleks";
  if (key.includes("çatı dubleks")) return "çatı dubleks";
  if (key.includes("çatı")) return "çatı";
  if (key.includes("teras")) return "teras";
  if (key.includes("zemin")) return "zemin";
  if (key.includes("asma")) return "asma";
  if (key.includes("ara")) return "ara";
  if (key.includes("en üst")) return "en üst";
  if (key.includes("bodrum")) return "bodrum";
  return text.replace(/\s*kat$/i, "").trim();
}

function joinComparableTurkishList(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ve ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} ve ${items[items.length - 1]}`;
}

function buildComparableSaleDateText(value) {
  const date = parseComparableDate(value);
  if (!date) return "yakın zamanda";
  const now = new Date();
  const diffDays = Math.max(0, Math.round((now.getTime() - date.getTime()) / 86400000));
  if (diffDays < 31) return `${diffDays} gün önce`;
  return `${Math.round(diffDays / 30)} ay önce`;
}

function parseComparableDate(value) {
  const text = String(value || "").trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return null;
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const date = new Date(year, Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatComparableArea(value, suffix = "m²") {
  const number = parseComparableNumber(value);
  if (Number.isFinite(number)) return `${number.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${suffix}`;
  const text = String(value || "").trim();
  return text ? text.replace(/\s*m[²2]?$/i, ` ${suffix}`) : "";
}

function roundComparableToNearest1000(value) {
  if (!Number.isFinite(value) || value <= 0) return Number.NaN;
  return Math.floor((value + 500) / 1000) * 1000;
}

function buildComparableSourceAblative(source) {
  const text = String(source || "").trim();
  if (!text) return "irtibattan";
  const lower = text.toLocaleLowerCase("tr-TR");
  const vowels = lower.match(/[aeıioöuü]/g);
  const lastVowel = vowels ? vowels[vowels.length - 1] : "a";
  let suffix = "eiöü".includes(lastVowel) ? "den" : "dan";
  if ("fstkçşhp".includes(lower.slice(-1))) suffix = suffix.replace("d", "t");
  return `${text}'${suffix}`;
}

function normalizeComparableText(value) {
  return String(value || "")
    .split("\n")
    .map((line) => normalizeReportSentenceLine(cleanComparablePunctuation(line.replace(/\s+/g, " ").trim())))
    .join("\n")
    .trim();
}

function cleanComparablePunctuation(value) {
  return String(value || "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.!?])\s*\1+/g, "$1")
    .replace(/([.!?])\s+([.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function openComparableLocationModal(row, rowIndex, onSave = () => {}) {
  document.querySelector(".modal-overlay")?.remove();
  const subjectPoint = getComparableSubjectPoint();
  const initialPoint = getComparableSavedPoint(row) || subjectPoint;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card modal-card-wide" role="dialog" aria-modal="true" aria-labelledby="comparableLocationModalTitle">
      <div class="modal-head">
        <h3 id="comparableLocationModalTitle">Emsal ${rowIndex + 1} Konumu</h3>
        <button class="modal-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-lead">Haritada emsalin yerini işaretleyin. KML merkezi varsa konu taşınmaz referansı olarak kullanılır.</p>
        <div class="comparable-location-map" data-comparable-location-map></div>
        <div class="form-grid">
          <label class="field">
            <span>Enlem</span>
            <input data-comparable-lat value="${escapeHtml(row.c18 || "")}" />
          </label>
          <label class="field">
            <span>Boylam</span>
            <input data-comparable-lng value="${escapeHtml(row.c19 || "")}" />
          </label>
          <label class="field field-wide">
            <span>Taşınmaza Göre Konum</span>
            <input data-comparable-location-text value="${escapeHtml(row.c20 || "")}" />
          </label>
        </div>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" data-cancel>Vazgeç</button>
        <button class="primary-button" type="button" data-save>Kaydet</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-cancel]").addEventListener("click", close);
  document.body.append(overlay);

  const latInput = overlay.querySelector("[data-comparable-lat]");
  const lngInput = overlay.querySelector("[data-comparable-lng]");
  const textInput = overlay.querySelector("[data-comparable-location-text]");
  let selectedPoint = initialPoint ? { lat: Number(initialPoint[0]), lng: Number(initialPoint[1]) } : null;

  const syncInputsFromPoint = (lat, lng) => {
    selectedPoint = { lat: Number(lat), lng: Number(lng) };
    latInput.value = selectedPoint.lat.toFixed(6);
    lngInput.value = selectedPoint.lng.toFixed(6);
    textInput.value = buildComparableLocationText(selectedPoint.lat, selectedPoint.lng);
  };

  [latInput, lngInput].forEach((input) => {
    input.addEventListener("input", () => {
      const lat = Number.parseFloat(String(latInput.value || "").replace(",", "."));
      const lng = Number.parseFloat(String(lngInput.value || "").replace(",", "."));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      selectedPoint = { lat, lng };
      textInput.value = buildComparableLocationText(lat, lng);
    });
  });

  renderComparableLocationMap(overlay, subjectPoint, selectedPoint, syncInputsFromPoint);

  overlay.querySelector("[data-save]").addEventListener("click", () => {
    const lat = Number.parseFloat(String(latInput.value || "").replace(",", "."));
    const lng = Number.parseFloat(String(lngInput.value || "").replace(",", "."));
    const targetRow = getComparableRows()[rowIndex] || row;
    targetRow.c18 = Number.isFinite(lat) ? lat.toFixed(6) : "";
    targetRow.c19 = Number.isFinite(lng) ? lng.toFixed(6) : "";
    targetRow.c20 = textInput.value.trim();
    row.c18 = targetRow.c18;
    row.c19 = targetRow.c19;
    row.c20 = targetRow.c20;
    onSave();
    close();
  });
}

function getComparableSubjectPoint() {
  const selected = getSelectedMapPoint();
  if (selected) return selected;
  const centroid = state.sourceValues.kml?.centroid;
  if (centroid && Number.isFinite(Number(centroid.lat)) && Number.isFinite(Number(centroid.lng))) {
    return [Number(centroid.lat), Number(centroid.lng)];
  }
  const firstCoordinate = state.sourceValues.kml?.coordinates?.[0];
  if (firstCoordinate && Number.isFinite(Number(firstCoordinate.lat)) && Number.isFinite(Number(firstCoordinate.lng))) {
    return [Number(firstCoordinate.lat), Number(firstCoordinate.lng)];
  }
  return null;
}

function getComparableSavedPoint(row) {
  const lat = Number.parseFloat(String(row.c18 || "").replace(",", "."));
  const lng = Number.parseFloat(String(row.c19 || "").replace(",", "."));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function buildComparableLocationText(lat, lng) {
  const subjectPoint = getComparableSubjectPoint();
  if (!subjectPoint) return "";
  const distance = calculateDistanceMeters(subjectPoint[0], subjectPoint[1], lat, lng);
  const direction = calculateRelativeDirectionText(subjectPoint[0], subjectPoint[1], lat, lng);
  return formatDistanceWithDirection(distance, direction);
}

function renderComparableLocationMap(overlay, subjectPoint, selectedPoint, onPointSelected) {
  const panel = overlay.querySelector("[data-comparable-location-map]");
  if (!panel) return;
  if (!isLeafletReady() || !subjectPoint) {
    panel.innerHTML = `<div class="map-placeholder">Harita için önce KML veya koordinat bilgisi gerekli.</div>`;
    return;
  }
  const leaflet = window.L;
  const map = leaflet.map(panel).setView(selectedPoint ? [selectedPoint.lat, selectedPoint.lng] : subjectPoint, 16);
  getLeafletTileLayer().addTo(map);

  const coordinates = state.sourceValues.kml?.coordinates || [];
  if (coordinates.length) {
    leaflet.polygon(coordinates.map((point) => [point.lat, point.lng]), {
      color: "#d92525",
      weight: 3,
      opacity: 0.95,
      fillColor: "#d92525",
      fillOpacity: 0.12,
    }).addTo(map);
  }

  leaflet.marker(subjectPoint).addTo(map).bindTooltip("KONU TAŞINMAZ", {
    permanent: true,
    direction: "left",
    offset: [-10, -20],
    className: "subject-map-label",
  });

  let marker = null;
  const setMarker = (lat, lng) => {
    if (!marker) {
      marker = leaflet.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", (event) => {
        const point = event.target.getLatLng();
        onPointSelected(point.lat, point.lng);
      });
    } else {
      marker.setLatLng([lat, lng]);
    }
    marker.bindPopup("Emsal konumu").openPopup();
  };

  if (selectedPoint && Number.isFinite(selectedPoint.lat) && Number.isFinite(selectedPoint.lng)) {
    setMarker(selectedPoint.lat, selectedPoint.lng);
  }

  map.on("click", (event) => {
    const { lat, lng } = event.latlng;
    setMarker(lat, lng);
    onPointSelected(lat, lng);
  });

  window.setTimeout(() => map.invalidateSize(), 0);
}

function createComparableFieldControl(field) {
  if (field.type === "select") {
    const select = document.createElement("select");
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Seçiniz";
    select.append(empty);
    field.options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      select.append(item);
    });
    return select;
  }
  if (field.type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.rows = 2;
    return textarea;
  }
  const input = document.createElement("input");
  if (field.type === "date") input.type = "date";
  return input;
}

function toComparableDateInputValue(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return "";
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}`;
}

function createTable(section) {
  const wrapper = document.createElement("div");
  wrapper.className = "subsection is-detail";
  const isOwnersTable = section.id === "title";
  const isEncumbranceReportTable = isEncumbranceReportTableKey(section.id);
  const isDocumentsTable = section.id === "documents";
  const hasDeleteColumn = isOwnersTable || isEncumbranceReportTable || isDocumentsTable;
  const headingRow = document.createElement("div");
  headingRow.className = "subsection-table-head";
  headingRow.innerHTML = `<h4>${formatUiHeading(section.table.title)}</h4>`;

  const shell = document.createElement("div");
  shell.className = "table-shell";
  const table = document.createElement("table");
  table.classList.add(`table-${section.id}`);
  if (isOwnersTable) {
    table.classList.add("owners-table");
  }
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  thead.innerHTML = `<tr>${section.table.columns.map((column) => `<th>${formatUiHeading(column)}</th>`).join("")}${hasDeleteColumn ? "<th></th>" : ""}</tr>`;

  let tableState = state.tables[section.id] || (isEncumbranceReportTable ? [] : Array.from({ length: section.table.rows }, () => ({})));
  if (isDocumentsTable && isLegacyEmptyDocumentTable(tableState)) {
    tableState = [];
  }
  if (isDocumentsTable) {
    tableState = tableState.map(prepareReviewedDocumentTableRow);
  }
  if (section.id === "encumbranceAnnotations") {
    tableState.forEach(normalizeTakbisAnnotationTableRow);
  }
  if (section.id === "encumbranceMortgages") {
    tableState.forEach((row) => {
      if (row?.c0) row.c0 = normalizeMortgageCreditorDisplay(row.c0);
    });
  }
  state.tables[section.id] = tableState;
  let ownerSummary = null;
  let annotationLienSummary = null;

  tableState.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    section.table.columns.forEach((column, columnIndex) => {
      const key = `c${columnIndex}`;
      const td = document.createElement("td");
      const isAnnotationDescription = section.id === "encumbranceAnnotations" && key === "c1";
      const isAnnotationAmount = section.id === "encumbranceAnnotations" && key === "c2";
      const input = createTableCellControl(section, key, isAnnotationDescription);
      if (isAnnotationDescription) {
        input.rows = 4;
        input.className = "table-textarea table-textarea-description";
      }
      input.value = row[key] || "";
      applyAnnotationAmountWarning(td, input, row, isAnnotationAmount);
      input.addEventListener("input", (event) => {
        row[key] = event.target.value;
        if (section.id === "encumbranceAnnotations") {
          normalizeTakbisAnnotationTableRow(row);
          const amountInput = tr.querySelector("td:nth-child(3) input");
          if (amountInput && amountInput.value !== (row.c2 || "")) {
            amountInput.value = row.c2 || "";
          }
          const amountCell = amountInput?.closest("td");
          applyAnnotationAmountWarning(amountCell, amountInput, row, Boolean(amountInput));
        }
        if (isOwnersTable && ownerSummary) {
          refreshTitleOwnershipKindFromOwners();
          updateOwnerShareSummary(ownerSummary, state.tables[section.id]);
        }
        if (section.id === "encumbranceAnnotations" && annotationLienSummary) {
          updateAnnotationLienSummary(annotationLienSummary, state.tables[section.id]);
        }
        if (isEncumbranceReportTableKey(section.id)) {
          syncLegacyEncumbranceTable();
          refreshEncumbranceSummaryFromCurrentData();
        }
        if (isDocumentsTable) {
          refreshReviewedDocumentsDescriptionFromCurrentRows();
        }
        autosave();
      });
      input.addEventListener("blur", () => {
        const formattedValue = normalizeReportTableValue(section, column, input.value);
        if (formattedValue === input.value) return;
        input.value = formattedValue;
        row[key] = formattedValue;
        if (section.id === "encumbranceAnnotations") {
          normalizeTakbisAnnotationTableRow(row);
        }
        if (isOwnersTable && ownerSummary) {
          refreshTitleOwnershipKindFromOwners();
          updateOwnerShareSummary(ownerSummary, state.tables[section.id]);
        }
        if (section.id === "encumbranceAnnotations" && annotationLienSummary) {
          updateAnnotationLienSummary(annotationLienSummary, state.tables[section.id]);
        }
        if (isEncumbranceReportTableKey(section.id)) {
          syncLegacyEncumbranceTable();
          refreshEncumbranceSummaryFromCurrentData();
        }
        if (isDocumentsTable) {
          refreshReviewedDocumentsDescriptionFromCurrentRows();
        }
        autosave();
      });
      td.append(input);
      tr.append(td);
    });
    if (hasDeleteColumn) {
      const td = document.createElement("td");
      td.className = "table-action-cell";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "row-delete-button";
      deleteButton.textContent = "X";
      deleteButton.setAttribute("aria-label", getTableDeleteButtonLabel(section.id, isOwnersTable));
      deleteButton.addEventListener("click", () => {
        state.tables[section.id].splice(rowIndex, 1);
        if (isOwnersTable && !state.tables[section.id].length) state.tables[section.id].push({});
        if (isOwnersTable) {
          refreshTitleOwnershipKindFromOwners();
        }
        if (isEncumbranceReportTable) {
          syncLegacyEncumbranceTable();
          refreshEncumbranceSummaryFromCurrentData();
        }
        if (isDocumentsTable) {
          refreshReviewedDocumentsDescriptionFromCurrentRows();
        }
        autosave();
        renderSection();
      });
      td.append(deleteButton);
      tr.append(td);
    }
    tbody.append(tr);
  });

  table.append(thead, tbody);
  if (tableState.length) {
    shell.append(table);
  }
  if (isOwnersTable) {
    ownerSummary = document.createElement("div");
    ownerSummary.className = "owner-share-summary";
    updateOwnerShareSummary(ownerSummary, tableState);
    shell.append(ownerSummary);
  }
  if (section.id === "encumbranceAnnotations") {
    annotationLienSummary = document.createElement("div");
    annotationLienSummary.className = "annotation-lien-summary";
    updateAnnotationLienSummary(annotationLienSummary, tableState);
  }

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "mini-button";
  addButton.textContent = getTableAddButtonText(section.id, isOwnersTable);
  addButton.addEventListener("click", () => {
    state.tables[section.id].push(isDocumentsTable ? createEmptyReviewedDocumentRow() : {});
    if (isOwnersTable) {
      refreshTitleOwnershipKindFromOwners();
    }
    if (isEncumbranceReportTableKey(section.id)) {
      syncLegacyEncumbranceTable();
      refreshEncumbranceSummaryFromCurrentData();
    }
    if (isDocumentsTable) {
      refreshReviewedDocumentsDescriptionFromCurrentRows();
    }
    autosave();
    renderSection();
  });

  if (isOwnersTable) {
    headingRow.append(addButton);
    wrapper.append(headingRow, shell);
  } else if (isEncumbranceReportTable) {
    headingRow.append(addButton);
    wrapper.append(headingRow);
    if (tableState.length) {
      wrapper.append(shell);
    } else {
      const emptyLine = document.createElement("div");
      emptyLine.className = "encumbrance-empty-line";
      wrapper.append(emptyLine);
    }
    if (annotationLienSummary) wrapper.append(annotationLienSummary);
  } else if (isDocumentsTable) {
    headingRow.append(addButton);
    wrapper.append(headingRow);
    if (tableState.length) {
      wrapper.append(shell);
    }
  } else {
    wrapper.append(headingRow, shell);
    if (annotationLienSummary) wrapper.append(annotationLienSummary);
    wrapper.append(addButton);
  }
  return wrapper;
}

function getTableAddButtonText(sectionId, isOwnersTable = false) {
  if (isOwnersTable) return "Malik ekle";
  if (sectionId === "documents") return "Belge ekle";
  if (sectionId === "encumbranceDeclarations") return "Beyan ekle";
  if (sectionId === "encumbranceMortgages") return "İpotek ekle";
  if (sectionId === "encumbranceAnnotations") return "Şerh ekle";
  return "Satır ekle";
}

function getTableDeleteButtonLabel(sectionId, isOwnersTable = false) {
  if (isOwnersTable) return "Maliki sil";
  if (sectionId === "documents") return "Belgeyi sil";
  if (sectionId === "encumbranceDeclarations") return "Beyanı sil";
  if (sectionId === "encumbranceMortgages") return "İpoteği sil";
  if (sectionId === "encumbranceAnnotations") return "Şerhi sil";
  return "Satırı sil";
}

function isLegacyEmptyDocumentTable(rows = []) {
  return rows.length === 4 && rows.every((row) => ["c0", "c1", "c2", "c3"].every((key) => !String(row?.[key] || "").trim()));
}

function prepareReviewedDocumentTableRow(row = {}) {
  const prepared = normalizeReviewedDocumentStorageRow(row);
  if (!String(prepared.c1 || "").trim()) {
    prepared.c1 = buildDefaultDocumentReviewInstitution();
  }
  return prepared;
}

function createEmptyReviewedDocumentRow() {
  return { c1: buildDefaultDocumentReviewInstitution() };
}

function createTableCellControl(section, key, isAnnotationDescription = false) {
  if (section.id === "documents" && key === "c0") {
    const select = document.createElement("select");
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Seçiniz";
    select.append(empty);
    documentTypeOptions.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      select.append(item);
    });
    return select;
  }
  if (section.id === "documents" && key === "c1") {
    const select = document.createElement("select");
    getDocumentInstitutionOptions().forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option || "Seçiniz";
      select.append(item);
    });
    return select;
  }
  if (section.id === "documents" && key === "c2") {
    const input = document.createElement("input");
    input.type = "date";
    return input;
  }
  if (section.id === "encumbranceMortgages" && key === "c0") {
    ensureMortgageCreditorBankDatalist();
    const input = document.createElement("input");
    input.setAttribute("list", "mortgage-creditor-bank-list");
    input.autocomplete = "off";
    return input;
  }
  return document.createElement(isAnnotationDescription ? "textarea" : "input");
}

function getDocumentInstitutionOptions() {
  const options = [
    buildDefaultDocumentReviewInstitution(),
    ...documentInstitutionStaticOptions,
    buildCitySpecificInstitution("İl Özel İdaresi"),
    buildCitySpecificInstitution("Büyükşehir Belediyesi"),
  ].filter(Boolean);
  return ["", ...new Set(options)];
}

function buildCitySpecificInstitution(suffix) {
  const city = normalizeReportTitleText(state.fields.titleCity || state.fields.city || "").trim();
  return city ? `${city} ${suffix}` : suffix;
}

function ensureMortgageCreditorBankDatalist() {
  if (document.querySelector("#mortgage-creditor-bank-list")) return;
  const list = document.createElement("datalist");
  list.id = "mortgage-creditor-bank-list";
  mortgageCreditorBankNames.forEach((bankName) => {
    const option = document.createElement("option");
    option.value = bankName;
    list.append(option);
  });
  document.body.append(list);
}

function updateAnnotationLienSummary(summaryElement, rows = []) {
  const totals = {
    public: 0,
    precautionary: 0,
    executive: 0,
  };
  const counts = {
    public: 0,
    precautionary: 0,
    executive: 0,
  };

  rows.forEach((row) => {
    const normalizedType = normalizeTakbisAnnotationReportType(row?.c0 || "", row?.c1 || "");
    const foldedType = foldTurkish(normalizedType);
    const amount = parseTakbisMoneyToNumber(row?.c2 || "");
    if (/KAMU/.test(foldedType)) {
      counts.public += 1;
      totals.public += amount;
    } else if (/IHTIYATI/.test(foldedType)) {
      counts.precautionary += 1;
      totals.precautionary += amount;
    } else if (/ICRAI/.test(foldedType) || /HACIZ/.test(foldedType)) {
      counts.executive += 1;
      totals.executive += amount;
    }
  });

  summaryElement.innerHTML = `
    <strong>Haciz Toplamları</strong>
    <span>Toplam Kamu Haczi (${counts.public}): ${formatTakbisSummaryMoney(totals.public)}</span>
    <span>Toplam İhtiyati Haciz: ${formatTakbisSummaryMoney(totals.precautionary)}</span>
    <span>Toplam İcrai Haciz: ${formatTakbisSummaryMoney(totals.executive)}</span>
  `;
  summaryElement.innerHTML = [
    "<strong>Haciz Toplamlar\u0131</strong>",
    `<span>Kamu Haczi Toplam\u0131 (${counts.public}): ${formatTakbisSummaryMoney(totals.public)}</span>`,
    `<span>\u0130htiyati Haciz Toplam\u0131 (${counts.precautionary}): ${formatTakbisSummaryMoney(totals.precautionary)}</span>`,
    `<span>\u0130crai Haciz Toplam\u0131 (${counts.executive}): ${formatTakbisSummaryMoney(totals.executive)}</span>`,
  ].join("");
}

function parseTakbisMoneyToNumber(value) {
  const rawText = cleanTakbisValue(value)
    .replace(/\b(?:TL|YTL|TRY|T\.L\.)\b/gi, "")
    .replace(/[₺]/g, "")
    .trim();
  if (!rawText) return 0;

  const match = rawText.match(/[0-9][0-9.,\s]*[0-9]|[0-9]/);
  if (!match) return 0;
  const text = match[0].replace(/\s+/g, "");
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : "";
  let integerPart = text.replace(/\D/g, "");
  let decimalPart = "";

  if (decimalSeparator) {
    const separatorIndex = text.lastIndexOf(decimalSeparator);
    const suffix = text.slice(separatorIndex + 1).replace(/\D/g, "");
    if (suffix.length > 0 && suffix.length <= 2) {
      integerPart = text.slice(0, separatorIndex).replace(/\D/g, "");
      decimalPart = suffix.padEnd(2, "0").slice(0, 2);
    }
  }

  const amount = Number(`${integerPart || "0"}.${decimalPart || "00"}`);
  return Number.isFinite(amount) ? amount : 0;
}

function formatTakbisSummaryMoney(value) {
  if (!value) return "-";
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;
}

function applyAnnotationAmountWarning(cell, input, row, isAmountCell) {
  if (!isAmountCell || !cell || !input) return;
  const isMissing = Boolean(row?.__amountMissing);
  cell.classList.toggle("cell-warning", isMissing);
  input.classList.toggle("input-warning", isMissing);
  input.placeholder = isMissing ? "OCR/ham metinden okunamadı" : "";
  input.title = isMissing
    ? "Haciz tutarı OCR ve ham metin kaynaklarından bulunamadı. Lütfen TAKBİS çıktısından kontrol edin."
    : "";
}

function isEncumbranceReportTableKey(key) {
  return encumbranceReportTables.some((table) => table.key === key);
}

function syncLegacyEncumbranceTable() {
  state.tables.encumbrance = encumbranceReportTables
    .flatMap((table) => (state.tables[table.key] || [])
      .filter((row) => Object.values(row || {}).some(Boolean))
      .map((row) => table.key === "encumbranceMortgages"
        ? {
            c0: "İpotek",
            c1: [row.c0, row.c1 ? `Derece: ${row.c1}` : "", row.c2 ? `Tutar: ${row.c2}` : ""]
              .filter(Boolean)
              .join(" - "),
            c2: row.c3 || "",
            c3: row.c4 || "",
          }
        : table.key === "encumbranceAnnotations"
          ? {
              c0: row.c0 || "",
              c1: row.c1 || "",
              c2: row.c3 || "",
              c3: row.c4 || "",
            }
        : { ...row }))
    .filter((row) => Object.values(row || {}).some(Boolean))
    .map((row) => ({ ...row }));
}

function updateOwnerShareSummary(element, rows) {
  const summary = formatOwnerShareSummary((rows || []).filter((row) => Object.values(row || {}).some(Boolean)));
  element.classList.toggle("is-ok", summary.ok);
  element.classList.toggle("is-warning", !summary.ok);
  element.textContent = summary.text;
}

function renderWorkflow() {
  const currentIndex = Math.min(
    Math.floor((sections.findIndex((item) => item.id === activeSectionId) / sections.length) * workflow.length),
    workflow.length - 1,
  );

  workflowList.innerHTML = "";
  workflow.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item;
    li.classList.toggle("is-current", index === currentIndex);
    workflowList.append(li);
  });
}

function renderDocuments() {
  const documents = [
    ["TAKBİS", state.uploads.takbis],
    ["Adres", state.uploads.address],
    ["EKB", state.uploads.ekb],
    ["KML", state.uploads.kml],
  ];

  documentQueue.innerHTML = "";
  documents.forEach(([label, file]) => {
    const item = document.createElement("div");
    item.className = "queue-item";
    item.innerHTML = `<span>${label}</span><span class="queue-status">${file ? "Hazır" : "Bekliyor"}</span>`;
    documentQueue.append(item);
  });
}

function getMissingRequiredFields() {
  return sections.flatMap((section) =>
    section.fields
      .filter((field) => field.required && !state.fields[field.key])
      .map((field) => `${section.title}: ${field.label}`),
  );
}

function renderValidation() {
  const missing = getMissingRequiredFields();
  const checks = [
    missing.length ? `${missing.length} zorunlu alan bekliyor` : "Zorunlu alanlar tamam",
    `Randevu ve belediye inceleme tarihi otomatik: ${state.system?.businessDateLabel || "-"}`,
    state.fields.bank ? "Banka profili seçildi" : "Banka profili seçilmeli",
    state.uploads.takbis ? "TAKBİS belgesi seçildi" : "TAKBİS belgesi henüz yok",
    state.fields.legalValue && state.fields.currentValue ? "Değerleme sonuçları girildi" : "Değerleme sonuçları bekliyor",
  ];

  validationList.innerHTML = "";
  checks.forEach((check) => {
    const li = document.createElement("li");
    li.textContent = check;
    li.classList.toggle("is-alert", check.includes("bekliyor") || check.includes("seçilmeli") || check.includes("henüz"));
    validationList.append(li);
  });
}

function updateStatus() {
  const missing = getMissingRequiredFields();
  const title = state.fields.caseName || "Yeni Ekspertiz Raporu";
  caseTitle.textContent = title;
  caseCode.textContent = state.fields.caseName ? "Taslak kayıt" : "Taslak";
  bankStatus.textContent = state.fields.bank || "Seçilmedi";
  missingCount.textContent = String(missing.length);
  lastSaved.textContent = state.updatedAt ? new Date(state.updatedAt).toLocaleString("tr-TR") : "Henüz yok";
}

document.querySelector("#saveBtn").addEventListener("click", () => {
  saveState();
  setSyncState("Kaydedildi", "Bu cihazdaki taslak güncel.", "saved");
});

document.querySelector("#newCaseBtn").addEventListener("click", () => {
  const confirmed = confirm("Yeni iş açılırsa mevcut yerel taslak temizlenecek. Devam edilsin mi?");
  if (!confirmed) return;
  localStorage.removeItem(storageKey);
  state = loadState();
  activeSectionId = sections[0].id;
  render();
});

fieldMode.addEventListener("change", render);

const initialImarRulesChanged = applyImarDerivedBusinessRules(state);
const initialTextNormalizationChanged = normalizeReportStateFields(state);
if (initialImarRulesChanged || initialTextNormalizationChanged) {
  saveState();
}

createNav();
render();
