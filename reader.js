/* Dedicated Quran reader. Quranic text is displayed verbatim from the installed pack. */
(() => {
  'use strict';
  const AUDIO_CACHE = 'compass-quran-audio-v1';
  const BASE_QARIS = [
    { id: 'alafasy', label: 'Mishary Alafasy', path: 'Alafasy_128kbps' },
    { id: 'husary', label: 'Mahmoud Khalil Al-Husary', path: 'Husary_128kbps' },
    { id: 'minshawi', label: 'Mohamed Siddiq Al-Minshawi', path: 'Minshawy_Murattal_128kbps' }
  ];
  const COPY = {
    en: {
      eyebrow: 'READ. LISTEN. REFLECT.', title: 'A little space for the Quran.',
      sidebar: 'All Surahs', findSurah: 'Find a Surah…', surah: 'Surah', ayahs: 'ayahs', meccan: 'Meccan', medinan: 'Medinan', juz: 'Juz',
      overview: 'Surah introduction', reader: 'Read', hifz: 'Hifz & revision', translation: 'Translation', english: 'English', urdu: 'Urdu', arabicOnly: 'Arabic only',
      readingLayout: 'Reading layout', pages: 'Pages', ayahCards: 'Ayah by ayah', page: 'Page', previousPage: 'Previous page', nextPage: 'Next page', pageTools: 'Translation & ayah tools', showAyahTools: 'Show ayah tools', pageNote: 'Pages are arranged for this reader. Printed Mushaf page numbers may differ.', audioSettings: 'Audio settings',
      jump: 'Jump to ayah', fontSmaller: 'Decrease Arabic text size', fontLarger: 'Increase Arabic text size', focus: 'Focus mode', exitFocus: 'Exit focus mode',
      progress: 'Reading progress', read: 'Read', completed: 'Completed', unread: 'Unread', reading: 'Reading', markComplete: 'Mark Surah complete',
      ayah: 'Ayah', readCheckbox: 'Mark ayah read', memorizeCheckbox: 'Memorized', bookmark: 'Bookmark ayah', unbookmark: 'Remove ayah bookmark',
      note: 'Reflection note', copy: 'Copy ayah', tafsir: 'Read tafsir', playAyah: 'Play this ayah', listen: 'Listen', play: 'Play', pause: 'Pause',
      previous: 'Previous ayah', next: 'Next ayah', qari: 'Reciter', speed: 'Playback speed', audioPosition: 'Audio position',
      autoFollow: 'Follow playback', download: 'Download this Surah', cancelDownload: 'Stop download', removeDownload: 'Remove downloaded audio',
      audioOffline: 'Audio ready offline', audioPartial: 'Ayahs saved offline', audioOnline: 'Audio plays online. Download this Surah to listen offline.',
      audioUnsupported: 'This browser cannot save audio offline. You can still listen online.',
      audioDownloading: 'Downloading audio', audioStopped: 'Download stopped. Saved ayahs are kept so you can resume.',
      audioSaved: 'This Surah is ready for offline listening.', audioRemoved: 'Downloaded audio removed.', audioRemoveError: 'The downloaded audio could not be removed. Please try again.', audioError: 'This ayah could not be played. Connect to the internet or download its audio first.',
      audioPlayError: 'Playback could not start. Tap Play again, or check your connection.', audioDownloadError: 'Audio could not be downloaded. Check your connection and available browser storage.',
      audioSource: 'Recitation from EveryAyah', currentAyah: 'Current ayah', rangeStart: 'From ayah', rangeEnd: 'To ayah', repeats: 'Passage repeats',
      hide: 'Hide passage', reveal: 'Reveal passage', revealAyah: 'Reveal ayah', hideAyah: 'Hide ayah', hiddenAyah: 'Recall this ayah, then reveal it.',
      hifzHelp: 'Choose a passage, recall the hidden ayahs, and listen on repeat. Mark memorized ayahs when you are ready.',
      startPractice: 'Listen to passage', loop: 'Passage', round: 'Round', memorized: 'Memorized', markRange: 'Mark passage memorized',
      revision: 'Schedule revision', revisionDate: 'Revision date', revisionSaved: 'Revision scheduled.', revisionDone: 'Revision completed',
      noteTitle: 'A thought to keep.', noteHint: 'Your own reflection, saved on this device.', noteLabel: 'Personal note', collection: 'Collection',
      collectionHint: 'General, Sabr, Shukr…', saveNote: 'Save note', deleteNote: 'Remove bookmark & note', cancel: 'Cancel', noteSaved: 'Your reflection is saved.',
      bookmarked: 'Ayah saved to your bookmarks.', bookmarkRemoved: 'Ayah bookmark removed.', bookmarkWithNote: 'This saved ayah has a personal note. Edit or remove it here.', copied: 'Ayah copied.', copyFailed: 'Select the ayah text to copy it in this browser.',
      packTitle: 'Bring the complete Quran into your reader.', packText: 'Download Arabic text and English/Urdu translations once, then read every Surah offline.',
      downloadPack: 'Download reading pack', importPack: 'Import a pack', packBusy: 'Preparing the reading pack…', noTranslation: 'This translation is not included in your pack.',
      previousSurah: 'Previous Surah', nextSurah: 'Next Surah', atEnd: 'You have reached the end of this Surah.',
      completeMessage: 'Surah marked complete.', markedRange: 'Passage marked memorized.', savedPosition: 'Your place is saved automatically. Reading counts when you mark an ayah read.',
      sourcedTafsir: 'Tafsir opens on Quran.com with its source reference. These links need an internet connection.',
      noSearch: 'No matching Surahs', close: 'Close', fullScreenUnavailable: 'Focus mode is active. Your browser does not support full-screen display here.',
      storageTitle: 'Your offline reading shelf', storageText: 'Quran text stays separate from optional recitation downloads.', textReady: 'Complete Arabic Quran text is ready offline.', textMissing: 'The complete reading pack has not been installed yet.',
      savedAudio: 'Downloaded recitations', noAudio: 'No Surah audio downloaded yet. Open a Surah in the reader and choose Download this Surah.', partial: 'Partial download', remove: 'Remove', checking: 'Checking saved packs…',
      scholar:'Translator / scholar', installedEdition:'Installed text pack', loadSelection:'Load this Surah', loadingSelection:'Loading selected source…', cancelLoad:'Cancel loading', refreshCatalog:'Refresh source catalog', catalogLoading:'Checking available editions…',
      translationReady:'Translation loaded', textMemory:'Available for this visit', textOffline:'Saved for offline reading', loadFailed:'The selected source could not be loaded. Your existing text is kept.', sourceUnavailable:'This source is not available here. Choose another edition or import a reading pack.',
      selectedSource:'Selected source', tafsirEdition:'Tafsir source', noTafsir:'No in-reader tafsir', loadTafsir:'Load tafsir', showTafsir:'Show tafsir', hideTafsir:'Hide tafsir', tafsirCoverage:'Ayahs covered', tafsirMissing:'This source has no entry for this ayah.', tafsirBook:'Chapter tafsir',
      audioMode:'Audio', recitationMode:'Arabic recitation', translationAudioMode:'Spoken translated meanings', audioLanguage:'Audio language', audioScholar:'Spoken translation source', loadSpoken:'Load spoken translation', noSpoken:'No sourced spoken translation is listed for this language.', spokenUnavailable:'The selected spoken translation could not be loaded. No speech is generated or substituted.',
      spokenSource:'Spoken translation source', audioMetadata:'Audio source metadata loaded. Download the audio files separately for offline listening.', studyTitle:'A chapter to study', studyGuide:'Reading guide', reflectionPrompts:'Questions for reflection', chapterArabic:'Load Arabic and the selected translation',
      languageChoice:'Language', sourceCatalogNote:'Editions come from their cited providers. A source is checked when loaded; availability may vary.', linkedSource:'Open source', loadToRead:'Load this Surah from a cited edition, or install the complete Quran pack below.',
      savedEditions:'Saved text & source editions',noEditions:'No individual editions saved yet. Load a Surah or tafsir from its source to keep it offline.',audioMetadataOnly:'Source metadata only · audio files are downloaded separately',editionRemoveError:'This saved source could not be removed.'
    },
    ur: {
      eyebrow: 'پڑھیے۔ سنیے۔ غور کیجیے۔', title: 'قرآن کے لیے کچھ وقت۔',
      sidebar: 'تمام سورتیں', findSurah: 'سورت تلاش کریں…', surah: 'سورت', ayahs: 'آیات', meccan: 'مکی', medinan: 'مدنی', juz: 'پارہ',
      overview: 'سورت کا تعارف', reader: 'مطالعہ', hifz: 'حفظ اور دہرائی', translation: 'ترجمہ', english: 'English', urdu: 'اردو', arabicOnly: 'صرف عربی',
      readingLayout: 'مطالعے کی ترتیب', pages: 'صفحات', ayahCards: 'آیت بہ آیت', page: 'صفحہ', previousPage: 'پچھلا صفحہ', nextPage: 'اگلا صفحہ', pageTools: 'ترجمہ اور آیت کی سہولتیں', showAyahTools: 'آیت کی سہولتیں دکھائیں', pageNote: 'یہ صفحات اس مطالعے کے لیے ترتیب دیے گئے ہیں۔ مطبوعہ مصحف کے صفحہ نمبر مختلف ہو سکتے ہیں۔', audioSettings: 'آڈیو کی ترتیبات',
      jump: 'آیت پر جائیں', fontSmaller: 'عربی متن چھوٹا کریں', fontLarger: 'عربی متن بڑا کریں', focus: 'یکسوئی کا موڈ', exitFocus: 'معمول کے موڈ میں واپس',
      progress: 'مطالعے کی پیش رفت', read: 'پڑھ لیا', completed: 'مکمل', unread: 'ابھی نہیں پڑھا', reading: 'مطالعہ جاری', markComplete: 'سورت مکمل نشان زد کریں',
      ayah: 'آیت', readCheckbox: 'آیت پڑھی ہوئی نشان زد کریں', memorizeCheckbox: 'یاد کر لیا', bookmark: 'آیت محفوظ کریں', unbookmark: 'محفوظ آیت ہٹائیں',
      note: 'ذاتی نوٹ', copy: 'آیت نقل کریں', tafsir: 'تفسیر پڑھیں', playAyah: 'یہ آیت سنیں', listen: 'تلاوت', play: 'سنیں', pause: 'روکیں',
      previous: 'پچھلی آیت', next: 'اگلی آیت', qari: 'قاری', speed: 'تلاوت کی رفتار', audioPosition: 'تلاوت میں مقام',
      autoFollow: 'تلاوت کے ساتھ متن دکھائیں', download: 'اس سورت کی تلاوت ڈاؤن لوڈ کریں', cancelDownload: 'ڈاؤن لوڈ روکیں', removeDownload: 'آف لائن تلاوت ہٹائیں',
      audioOffline: 'تلاوت آف لائن دستیاب ہے', audioPartial: 'آیات آف لائن محفوظ ہیں', audioOnline: 'تلاوت آن لائن چلتی ہے۔ آف لائن سننے کے لیے یہ سورت ڈاؤن لوڈ کریں۔',
      audioUnsupported: 'یہ براؤزر تلاوت آف لائن محفوظ نہیں کر سکتا۔ آپ آن لائن سن سکتے ہیں۔',
      audioDownloading: 'تلاوت ڈاؤن لوڈ ہو رہی ہے', audioStopped: 'ڈاؤن لوڈ روک دیا گیا۔ محفوظ آیات برقرار ہیں؛ بعد میں جاری رکھ سکتے ہیں۔',
      audioSaved: 'یہ سورت آف لائن تلاوت کے لیے تیار ہے۔', audioRemoved: 'ڈاؤن لوڈ کی گئی تلاوت ہٹا دی گئی۔', audioRemoveError: 'ڈاؤن لوڈ کی گئی تلاوت نہیں ہٹ سکی۔ دوبارہ کوشش کریں۔', audioError: 'یہ آیت نہیں چل سکی۔ انٹرنیٹ سے جڑیں یا پہلے اس کی تلاوت ڈاؤن لوڈ کریں۔',
      audioPlayError: 'تلاوت شروع نہیں ہو سکی۔ دوبارہ سنیں دبائیں یا انٹرنیٹ دیکھیں۔', audioDownloadError: 'تلاوت ڈاؤن لوڈ نہیں ہو سکی۔ انٹرنیٹ اور براؤزر میں دستیاب جگہ دیکھیں۔',
      audioSource: 'تلاوت کا ماخذ: EveryAyah', currentAyah: 'موجودہ آیت', rangeStart: 'آیت سے', rangeEnd: 'آیت تک', repeats: 'حصہ کتنی بار دہرائیں',
      hide: 'حصہ چھپائیں', reveal: 'حصہ دکھائیں', revealAyah: 'آیت دکھائیں', hideAyah: 'آیت چھپائیں', hiddenAyah: 'پہلے آیت یاد سے پڑھیں، پھر اسے دکھائیں۔',
      hifzHelp: 'حصہ منتخب کریں، چھپی ہوئی آیات یاد سے پڑھیں اور بار بار تلاوت سنیں۔ تیاری ہونے پر آیات یاد شدہ نشان زد کریں۔',
      startPractice: 'منتخب حصہ سنیں', loop: 'منتخب حصہ', round: 'بار', memorized: 'یاد شدہ', markRange: 'منتخب حصہ یاد شدہ نشان زد کریں',
      revision: 'دہرائی کا وقت مقرر کریں', revisionDate: 'دہرائی کی تاریخ', revisionSaved: 'دہرائی کا وقت محفوظ ہو گیا۔', revisionDone: 'دہرائی مکمل',
      noteTitle: 'ایک خیال محفوظ کریں۔', noteHint: 'آپ کی اپنی سوچ، اسی آلے پر محفوظ۔', noteLabel: 'ذاتی نوٹ', collection: 'مجموعہ',
      collectionHint: 'عام، صبر، شکر…', saveNote: 'نوٹ محفوظ کریں', deleteNote: 'محفوظ آیت اور نوٹ ہٹائیں', cancel: 'واپس', noteSaved: 'آپ کا نوٹ محفوظ ہو گیا۔',
      bookmarked: 'آیت محفوظ آیات میں شامل ہو گئی۔', bookmarkRemoved: 'محفوظ آیت ہٹا دی گئی۔', bookmarkWithNote: 'اس محفوظ آیت کے ساتھ ذاتی نوٹ ہے۔ یہاں اسے تبدیل یا ہٹا سکتے ہیں۔', copied: 'آیت نقل ہو گئی۔', copyFailed: 'اس براؤزر میں نقل کرنے کے لیے آیت کا متن منتخب کریں۔',
      packTitle: 'مکمل قرآن اپنے مطالعے میں شامل کریں۔', packText: 'عربی متن اور اردو/انگریزی ترجمہ ایک بار ڈاؤن لوڈ کریں، پھر ہر سورت آف لائن پڑھیں۔',
      downloadPack: 'قرآن متن ڈاؤن لوڈ کریں', importPack: 'متن فائل شامل کریں', packBusy: 'قرآن متن تیار ہو رہا ہے…', noTranslation: 'آپ کی متن فائل میں یہ ترجمہ شامل نہیں ہے۔',
      previousSurah: 'پچھلی سورت', nextSurah: 'اگلی سورت', atEnd: 'آپ اس سورت کے اختتام پر پہنچ گئے ہیں۔',
      completeMessage: 'سورت مکمل نشان زد ہو گئی۔', markedRange: 'منتخب حصہ یاد شدہ نشان زد ہو گیا۔', savedPosition: 'آپ کا مقام خود محفوظ ہوتا ہے۔ مطالعہ تب شمار ہوتا ہے جب آپ آیت پڑھی ہوئی نشان زد کریں۔',
      sourcedTafsir: 'تفسیر Quran.com پر اپنے ماخذ کے ساتھ کھلتی ہے۔ ان روابط کے لیے انٹرنیٹ ضروری ہے۔',
      noSearch: 'کوئی سورت نہیں ملی', close: 'بند کریں', fullScreenUnavailable: 'یکسوئی کا موڈ فعال ہے۔ یہاں براؤزر مکمل اسکرین کی سہولت نہیں دیتا۔',
      storageTitle: 'آپ کا آف لائن مطالعہ', storageText: 'قرآن متن اور اختیاری تلاوت ڈاؤن لوڈ الگ محفوظ ہوتے ہیں۔', textReady: 'مکمل عربی قرآن متن آف لائن دستیاب ہے۔', textMissing: 'مکمل قرآن متن ابھی شامل نہیں کیا گیا۔',
      savedAudio: 'محفوظ تلاوت', noAudio: 'ابھی کسی سورت کی تلاوت ڈاؤن لوڈ نہیں ہوئی۔ مطالعے میں سورت کھول کر ڈاؤن لوڈ منتخب کریں۔', partial: 'کچھ آیات محفوظ', remove: 'ہٹائیں', checking: 'محفوظ متن اور تلاوت دیکھ رہے ہیں…',
      scholar:'مترجم / عالم', installedEdition:'شامل کردہ متن', loadSelection:'یہ سورت شامل کریں', loadingSelection:'منتخب ماخذ شامل ہو رہا ہے…', cancelLoad:'شامل کرنا روکیں', refreshCatalog:'ماخذ کی فہرست تازہ کریں', catalogLoading:'دستیاب متن دیکھ رہے ہیں…',
      translationReady:'ترجمہ شامل ہو گیا', textMemory:'اس نشست میں دستیاب', textOffline:'آف لائن مطالعے کے لیے محفوظ', loadFailed:'منتخب ماخذ شامل نہیں ہو سکا۔ موجودہ متن برقرار ہے۔', sourceUnavailable:'یہ ماخذ یہاں دستیاب نہیں ہے۔ دوسرا متن منتخب کریں یا قرآن فائل شامل کریں۔',
      selectedSource:'منتخب ماخذ', tafsirEdition:'تفسیر کا ماخذ', noTafsir:'مطالعے میں تفسیر بند', loadTafsir:'تفسیر شامل کریں', showTafsir:'تفسیر دکھائیں', hideTafsir:'تفسیر چھپائیں', tafsirCoverage:'جن آیات کی تفسیر موجود ہے', tafsirMissing:'اس ماخذ میں اس آیت کی تفسیر موجود نہیں ہے۔', tafsirBook:'سورت کی تفسیر',
      audioMode:'آڈیو', recitationMode:'عربی تلاوت', translationAudioMode:'ترجمے کی آواز', audioLanguage:'آڈیو کی زبان', audioScholar:'ترجمے کی آواز کا ماخذ', loadSpoken:'ترجمے کی آواز شامل کریں', noSpoken:'اس زبان میں ماخذ کے ساتھ ترجمے کی آواز فہرست میں موجود نہیں ہے۔', spokenUnavailable:'منتخب ترجمے کی آواز دستیاب نہیں ہو سکی۔ کوئی آواز بنا کر اس کے بدلے نہیں چلائی جاتی۔',
      spokenSource:'ترجمے کی آواز کا ماخذ', audioMetadata:'آڈیو ماخذ کی معلومات شامل ہو گئیں۔ آف لائن سننے کے لیے آڈیو فائلیں الگ ڈاؤن لوڈ کریں۔', studyTitle:'اس سورت کا مطالعہ', studyGuide:'مطالعے کی رہنمائی', reflectionPrompts:'غور و فکر کے سوال', chapterArabic:'عربی متن اور منتخب ترجمہ شامل کریں',
      languageChoice:'زبان', sourceCatalogNote:'متن درج شدہ ماخذ سے حاصل ہوتے ہیں۔ شامل کرتے وقت ماخذ کی جانچ ہوتی ہے؛ دستیابی مختلف ہو سکتی ہے۔', linkedSource:'ماخذ کھولیں', loadToRead:'درج شدہ ماخذ سے یہ سورت شامل کریں یا نیچے مکمل قرآن فائل شامل کریں۔',
      savedEditions:'محفوظ متن اور ماخذ',noEditions:'ابھی کوئی الگ متن محفوظ نہیں۔ ماخذ سے سورت یا تفسیر شامل کریں تاکہ آف لائن پڑھ سکیں۔',audioMetadataOnly:'صرف ماخذ کی معلومات؛ آڈیو فائلیں الگ ڈاؤن لوڈ ہوتی ہیں',editionRemoveError:'یہ محفوظ ماخذ نہیں ہٹ سکا۔'
    }
  };
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const icons = {
    play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',previous:'<path d="m17 5-9 7 9 7M5 5v14"/>',next:'<path d="m7 5 9 7-9 7M19 5v14"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',note:'<path d="M4 4h16v12l-5 5H4Zm11 17v-5h5M8 8h8m-8 4h5"/>',copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',focus:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',book:'<path d="M12 6C9 3 5 3 2 4v14c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v14"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/>',settings:'<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>'
  };
  function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.book}</svg>`; }
  function settings() { return globalThis.CompanionStore?.settings?.() || {}; }
  function language() { return settings().uiLanguage === 'ur' ? 'ur' : 'en'; }
  function t(key) { return COPY[language()][key] || COPY.en[key] || key; }
  function store() { return globalThis.CompanionStore; }
  function status(id) { return store()?.status?.(id) || { status:'unread',lastAyah:1,readAyahs:[],memorizedAyahs:[] }; }
  function bookmarks() { return store()?.bookmarks?.() || []; }
  function pack() { return globalThis.CompassApp?.getQuran?.() || globalThis.QURAN || {}; }
  function sources() { return globalThis.CompassApp?.getSources?.() || globalThis.QURAN_SOURCES || {}; }
  const content = () => globalThis.CompassContent;
  let catalogSnapshot=content()?.getCatalog?.()||globalThis.COMPASS_EDITIONS||{};
  const loadedArabic=new Map(),loadedTranslations=new Map(),loadedTafsirs=new Map(),loadedSpoken=new Map();
  const editionKey=(id,chapter)=>`${id}:${chapter}`;
  function catalogEntries(kind){return Array.isArray(catalogSnapshot[kind])?catalogSnapshot[kind]:[];}
  function reciters(){const records=[...catalogEntries('reciters'),...BASE_QARIS];const seen=new Set();return records.filter(q=>q&&typeof q.id==='string'&&typeof q.label==='string'&&typeof q.path==='string'&&/^[A-Za-z0-9_.-]+$/.test(q.path)&&!q.path.includes('..')&&!seen.has(q.id)&&(seen.add(q.id),true));}
  function languageLabel(code){const names={en:t('english'),ur:t('urdu'),ar:t('arabicOnly'),fr:'Français',es:'Español',de:'Deutsch',id:'Bahasa Indonesia',tr:'Türkçe',fa:'فارسی',bn:'বাংলা',hi:'हिन्दी',ru:'Русский',zh:'中文',it:'Italiano',pt:'Português',ms:'Bahasa Melayu',sw:'Kiswahili',ta:'தமிழ்',th:'ไทย',az:'Azərbaycan',uz:'O‘zbekcha',sq:'Shqip'};return names[code]||catalogEntries('translations').find(e=>e.language===code)?.languageLabel||code;}
  const textDirection=code=>['ar','ur','fa','ps','ug','he'].includes(code)?'rtl':'ltr';
  function builtinEdition(code){return {id:`builtin:${code}`,language:code,label:sources()[code]||`${languageLabel(code)} · ${t('installedEdition')}`,author:sources()[code]||t('installedEdition'),provider:t('installedEdition')};}
  function translationEditions(code){return [...(['en','ur'].includes(code)?[builtinEdition(code)]:[]),...catalogEntries('translations').filter(e=>e.language===code)];}
  function webLink(raw){return typeof raw==='string'&&/^https:\/\/(?:quran\.com|api\.quran\.com|alquran\.cloud|api\.alquran\.cloud|quranenc\.com|tanzil\.net|everyayah\.com|cdn\.islamic\.network|islamic\.network)(?:\/|$)[^\s]*$/i.test(raw)?raw:'';}
  function vettedAudioURL(raw){return typeof raw==='string'&&/^https:\/\/(?:everyayah\.com|cdn\.islamic\.network|islamic\.network)\/[^\s#]*$/i.test(raw)?raw:'';}
  function plainText(raw){return String(raw??'').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'').replace(/<br\b[^>]*>/gi,'\n').replace(/<\/(?:p|div|li|h[1-6])\s*>/gi,'\n').replace(/<\/?[a-z!][^>]*>/gi,'').replace(/&(?:amp|lt|gt|quot|apos|nbsp|mdash|ndash);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ','&mdash;':String.fromCharCode(8212),'&ndash;':'–'}[entity])).replace(/&#(x[0-9a-f]+|\d+);/gi,(_,code)=>{const value=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return Number.isInteger(value)&&value>0&&value<=0x10ffff&&!(value>=0xd800&&value<=0xdfff)?String.fromCodePoint(value):'';}).replace(/\n{3,}/g,'\n\n').trim();}
  let preferencesPersistent=true;
  function loadSetting(key, fallback) { if(!preferencesPersistent)return fallback;let value;try{value=localStorage.getItem('compass-reader-'+key);}catch{preferencesPersistent=false;return fallback;}if(value===null)return fallback;try{return JSON.parse(value);}catch{return fallback;} }
  function saveSetting(key, value) { if(!preferencesPersistent)return;try { localStorage.setItem('compass-reader-'+key,JSON.stringify(value)); } catch {preferencesPersistent=false;} }
  const state = {
    surahId:1, ayah:1, translation:loadSetting('translation','en'),fontSize:Number(loadSetting('font-size',38)),qariId:loadSetting('qari','alafasy'),
    translationEdition:loadSetting('translation-edition',''),tafsirEdition:loadSetting('tafsir-edition','none'),tafsirShown:new Set(),audioMode:loadSetting('audio-mode','recitation'),audioLanguage:loadSetting('audio-language','en'),audioEdition:loadSetting('audio-edition',''),
    mode:'read',layout:loadSetting('layout','pages'),page:0,pageToolsOpen:false,audioSettings:false,start:1,end:7,repeats:3,round:0,practice:false,revealed:new Set(),focus:false,follow:loadSetting('follow',true),rate:Number(loadSetting('rate',1))
  };
  if(!['en','ur','ar',...catalogEntries('translations').map(e=>e.language)].includes(state.translation))state.translation='en';
  if(!state.translationEdition)state.translationEdition=`builtin:${state.translation==='ur'?'ur':'en'}`;
  if(!Number.isFinite(state.fontSize))state.fontSize=38;state.fontSize=Math.max(24,Math.min(48,state.fontSize));
  if(!reciters().some(q=>q.id===state.qariId))state.qariId=BASE_QARIS[0].id;
  if(!['recitation','translation'].includes(state.audioMode))state.audioMode='recitation';
  if(!['ayahs','pages'].includes(state.layout))state.layout='pages';
  if(![.75,1,1.25,1.5].includes(state.rate))state.rate=1;
  let root=null, audio=null, audioToken=0, audioAyah=null, audioLoading=false, objectURL=null, observer=null, dockObserver=null, bookmarkAyah=null;
  let downloading=null, downloadPromise=null, messageTimer=null, lastPositionTimer=null;
  let readingJob=null,tafsirJob=null,catalogJob=null,audioController=null,contentSequence=0;
  const s = () => globalThis.SURAHS?.[state.surahId-1];
  const qari = () => reciters().find(q=>q.id===state.qariId) || BASE_QARIS[0];
  function arabicRecord(chapter=state.surahId){return loadedArabic.get(chapter)||content()?.getArabic?.(chapter)||content()?.getLoaded?.('arabic','quran-uthmani',chapter);}
  const verses = () => { const vv=pack()[state.surahId];if(Array.isArray(vv)&&vv.length===s()?.total_verses)return vv;const record=arabicRecord();return record?.complete&&Array.isArray(record.ayahs)&&record.ayahs.length===s()?.total_verses?record.ayahs.map(v=>({id:v.number,text:v.text})):[]; };
  function translationRecord(id=state.translationEdition,chapter=state.surahId){return loadedTranslations.get(editionKey(id,chapter))||content()?.getLoaded?.('translation',id,chapter);}
  function tafsirRecord(id=state.tafsirEdition,chapter=state.surahId){return loadedTafsirs.get(editionKey(id,chapter))||content()?.getLoaded?.('tafsir',id,chapter);}
  function spokenRecord(id=state.audioEdition,chapter=state.surahId){return loadedSpoken.get(editionKey(id,chapter))||content()?.getLoaded?.('audioTranslation',id,chapter);}
  function selectedTranslation(){return translationRecord()?.edition||translationEditions(state.translation).find(e=>e.id===state.translationEdition);}
  function translatedText(v,chapter=state.surahId){if(state.translation==='ar')return '';if(state.translationEdition.startsWith('builtin:'))return state.translation==='en'?v.translation_en||'':state.translation==='ur'?v.translation_ur||'':'';const record=translationRecord(state.translationEdition,chapter);return record?.ayahs?.find(row=>row.number===v.id)?.text||'';}
  function audioURL(surahId,ayah,qariId=state.qariId){const q=reciters().find(q=>q.id===qariId)||BASE_QARIS[0];return `https://everyayah.com/data/${q.path}/${String(surahId).padStart(3,'0')}${String(ayah).padStart(3,'0')}.mp3`;}
  function announce(message){if($('reader-message')){$('reader-message').textContent=message;$('reader-message').hidden=false;clearTimeout(messageTimer);messageTimer=setTimeout(()=>{if($('reader-message'))$('reader-message').hidden=true;},5000);}if(globalThis.CompassApp?.toast)globalThis.CompassApp.toast(message);}
  function isVisible(){return root&&!root.hidden;}
  function ensureShell(){
    if(root)return true;root=$('reader-view');if(!root)return false;
    root.classList.add('quran-reader-view');
    root.innerHTML=`<div class="reader-page-heading"><div><div class="eyebrow" id="reader-eyebrow"></div><h1 id="reader-page-title"></h1></div><button class="secondary-button" id="reader-focus">${icon('focus')}<span></span></button></div>
      <div class="reader-layout"><aside class="reader-sidebar"><div class="reader-sidebar-heading" id="reader-sidebar-heading"></div><label class="reader-surah-search">${icon('search')}<input id="reader-surah-search" type="search"></label><div class="reader-sidebar-list" id="reader-surah-list"></div></aside>
      <div class="reader-main"><div class="reader-controls-dock" id="reader-controls-dock"><section class="reader-audio-bar" aria-label="Audio recitation"><div class="reader-audio-transport"><div class="reader-audio-title"><span>${icon('book')}</span><div><strong id="reader-audio-surah"></strong><small id="reader-audio-ayah"></small></div></div><div class="reader-play-controls"><button class="icon-button" id="reader-audio-previous">${icon('previous')}</button><button class="reader-play-button" id="reader-audio-play">${icon('play')}</button><button class="icon-button" id="reader-audio-next">${icon('next')}</button></div><div class="reader-audio-seek"><span id="reader-audio-current">0:00</span><input id="reader-audio-seek" type="range" min="0" max="100" value="0" step=".1"><span id="reader-audio-duration">0:00</span></div><button class="icon-button reader-audio-settings-toggle" id="reader-audio-settings-toggle" aria-expanded="false" aria-controls="reader-audio-settings">${icon('settings')}</button></div><div class="reader-audio-settings" id="reader-audio-settings" hidden><label class="reader-audio-mode-field"><span id="reader-audio-mode-label"></span><select id="reader-audio-mode"></select></label><label class="reader-qari-field" id="reader-qari-field"><span id="reader-qari-label"></span><select id="reader-qari" dir="ltr"></select></label><label class="reader-audio-language-field" id="reader-audio-language-field" hidden><span id="reader-audio-language-label"></span><select id="reader-audio-language"></select></label><label class="reader-audio-edition-field" id="reader-audio-edition-field" hidden><span id="reader-audio-edition-label"></span><select id="reader-audio-edition" dir="ltr"></select></label><label class="reader-speed-field"><span id="reader-speed-label"></span><select id="reader-audio-rate" dir="ltr"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><label class="reader-follow-field"><input id="reader-follow" type="checkbox"><span></span></label><div class="reader-audio-download-row"><span id="reader-audio-status"></span><button class="text-button" id="reader-load-spoken" hidden><span></span></button><button class="text-button" id="reader-audio-download">${icon('download')}<span></span></button><button class="text-button" id="reader-audio-remove" hidden>${icon('close')}<span></span></button><a href="https://everyayah.com/" target="_blank" rel="noopener noreferrer" id="reader-audio-source"></a></div></div></section><div class="reader-toolbar"><label><span id="reader-translation-label"></span><select id="reader-translation"></select></label><label class="reader-scholar-field"><span id="reader-scholar-label"></span><select id="reader-translation-edition"></select></label><label><span id="reader-jump-label"></span><select id="reader-jump"></select></label><div class="reader-font-buttons"><button class="icon-button" id="reader-font-minus">A−</button><span id="reader-font-size"></span><button class="icon-button" id="reader-font-plus">A+</button></div></div><div class="reader-page-navigation" id="reader-page-navigation" hidden><button class="secondary-button" id="reader-page-previous">${icon('arrow')}<span></span></button><span id="reader-page-position" role="status" aria-live="polite"></span><button class="secondary-button" id="reader-page-next"><span></span>${icon('arrow')}</button></div></div><div class="reader-chapter-heading"><div><span class="reader-chapter-kicker" id="reader-chapter-kicker"></span><h2 id="reader-surah-title" dir="ltr"></h2><p id="reader-surah-meaning"></p></div><span id="reader-surah-arabic" class="reader-surah-arabic" lang="ar" dir="rtl"></span></div>
        <div class="reader-chapter-meta"><span id="reader-chapter-meta"></span><button class="text-button" id="reader-overview">${icon('book')}<span></span></button></div>
        <div class="reader-mode-tabs" role="tablist" aria-label="Reader mode"><button id="reader-read-tab" role="tab" aria-selected="true" aria-controls="reader-text"></button><button id="reader-hifz-tab" role="tab" aria-selected="false" aria-controls="reader-hifz-panel"></button></div>
        <div class="reader-reading-layout" id="reader-reading-layout" role="group"><span id="reader-layout-label"></span><button id="reader-layout-pages" aria-pressed="true"></button><button id="reader-layout-ayahs" aria-pressed="false"></button></div>
        <div class="reader-source-actions"><button class="secondary-button" id="reader-load-selection">${icon('download')}<span></span></button><button class="text-button" id="reader-cancel-selection" hidden>${icon('close')}<span></span></button><button class="text-button" id="reader-refresh-catalog"><span></span></button><span id="reader-edition-status" role="status" aria-live="polite"></span></div><p class="reader-selected-source" id="reader-selected-source"></p>
        <div class="reader-tafsir-toolbar"><label><span id="reader-tafsir-label"></span><select id="reader-tafsir-edition"></select></label><button class="secondary-button" id="reader-load-tafsir">${icon('book')}<span></span></button><button class="text-button" id="reader-cancel-tafsir" hidden>${icon('close')}<span></span></button><span id="reader-tafsir-status" role="status" aria-live="polite"></span></div>
        <section class="reader-hifz-panel" id="reader-hifz-panel" role="tabpanel" aria-labelledby="reader-hifz-tab" hidden><p id="reader-hifz-help"></p><div class="reader-hifz-fields"><label><span id="reader-range-start-label"></span><input id="reader-range-start" type="number" min="1" value="1"></label><label><span id="reader-range-end-label"></span><input id="reader-range-end" type="number" min="1" value="7"></label><label><span id="reader-repeat-label"></span><select id="reader-repeat"><option value="1">1×</option><option value="3">3×</option><option value="5">5×</option><option value="10">10×</option></select></label></div><div class="reader-hifz-actions"><button class="secondary-button" id="reader-reveal-all">${icon('eye')}<span></span></button><button class="primary-button" id="reader-practice">${icon('play')}<span></span></button><button class="text-button" id="reader-memorize-range">${icon('check')}<span></span></button></div><div class="reader-revision-row"><label><span id="reader-revision-label"></span><input id="reader-revision-date" type="date"></label><button class="secondary-button" id="reader-schedule-revision">${icon('calendar')}<span></span></button><button class="text-button" id="reader-revised"><span></span></button></div></section>
        <div class="reader-progress-row"><div><span id="reader-progress-label"></span><strong id="reader-progress-count"></strong></div><button class="text-button" id="reader-mark-complete">${icon('check')}<span></span></button></div><div class="reader-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="reader-progress-fill"></div></div>
        <section class="reader-study-page" id="reader-study-page"></section><div class="reader-message" id="reader-message" role="status" aria-live="polite" hidden></div><section id="reader-text" class="reader-text" role="tabpanel" aria-labelledby="reader-read-tab"></section><p class="reader-pagination-note" id="reader-pagination-note" hidden></p><section id="reader-tafsir-book" class="reader-tafsir-book" hidden></section><p class="reader-source-note" id="reader-text-source"></p>
        <div class="reader-bottom-nav"><button class="secondary-button" id="reader-previous-surah">${icon('arrow')}<span></span></button><span id="reader-bottom-position"></span><button class="secondary-button" id="reader-next-surah"><span></span>${icon('arrow')}</button></div><p class="reader-saving-note" id="reader-saving-note"></p>
      </div></div>
      <dialog class="reader-note-dialog" id="reader-note-dialog" aria-labelledby="reader-note-title"><div class="reader-note-heading"><span class="reader-note-kicker" id="reader-note-reference"></span><button class="icon-button" id="reader-note-close">${icon('close')}</button></div><h2 id="reader-note-title"></h2><p id="reader-note-hint"></p><form id="reader-note-form"><label><span id="reader-note-label"></span><textarea id="reader-note-text" dir="auto" rows="6" maxlength="10000"></textarea></label><label><span id="reader-collection-label"></span><input id="reader-note-collection" type="text" dir="auto" list="reader-collection-list" maxlength="60"><datalist id="reader-collection-list"></datalist></label><div class="reader-note-actions"><button class="text-button" type="button" id="reader-note-delete"></button><button class="primary-button" type="submit" id="reader-note-save"></button></div></form></dialog>`;
    bindEvents();
    if(typeof ResizeObserver==='function'){dockObserver=new ResizeObserver(updateDockHeight);dockObserver.observe($('reader-controls-dock'));}
    if(typeof Audio==='function'){audio=new Audio();audio.preload='metadata';audio.playbackRate=state.rate;bindAudio();}
    return true;
  }
  function updateDockHeight(){const dock=$('reader-controls-dock');if(!dock||!root)return;const height=dock.getBoundingClientRect().height||dock.offsetHeight||0;if(height>0)root.style.setProperty('--reader-dock-height',Math.ceil(height)+'px');}
  function setAudioSettings(open){state.audioSettings=!!open;root.classList.toggle('reader-audio-settings-open',state.audioSettings);$('reader-audio-settings').hidden=!state.audioSettings;$('reader-audio-settings-toggle').setAttribute('aria-expanded',state.audioSettings);}
  function applyLanguage(){
    if(!root)return;const lang=language();root.dataset.readerLanguage=lang;root.dir=lang==='ur'?'rtl':'ltr';
    const labels={
      'reader-eyebrow':'eyebrow','reader-page-title':'title','reader-sidebar-heading':'sidebar','reader-read-tab':'reader','reader-hifz-tab':'hifz','reader-translation-label':'translation','reader-jump-label':'jump','reader-layout-label':'readingLayout','reader-layout-pages':'pages','reader-layout-ayahs':'ayahCards','reader-pagination-note':'pageNote',
      'reader-hifz-help':'hifzHelp','reader-range-start-label':'rangeStart','reader-range-end-label':'rangeEnd','reader-repeat-label':'repeats','reader-revision-label':'revisionDate','reader-progress-label':'progress',
      'reader-qari-label':'qari','reader-speed-label':'speed','reader-audio-source':'audioSource','reader-note-title':'noteTitle','reader-note-hint':'noteHint','reader-note-label':'noteLabel','reader-collection-label':'collection','reader-scholar-label':'scholar','reader-tafsir-label':'tafsirEdition','reader-audio-mode-label':'audioMode','reader-audio-language-label':'audioLanguage','reader-audio-edition-label':'audioScholar',
      'reader-note-delete':'deleteNote','reader-note-save':'saveNote','reader-saving-note':'savedPosition'
    };
    Object.entries(labels).forEach(([id,key])=>{if($(id))$(id).textContent=t(key);});
    const spans={'reader-overview':'overview','reader-practice':'startPractice','reader-memorize-range':'markRange','reader-schedule-revision':'revision','reader-revised':'revisionDone','reader-mark-complete':'markComplete','reader-previous-surah':'previousSurah','reader-next-surah':'nextSurah','reader-load-selection':'loadSelection','reader-cancel-selection':'cancelLoad','reader-refresh-catalog':'refreshCatalog','reader-load-tafsir':'loadTafsir','reader-cancel-tafsir':'cancelLoad','reader-load-spoken':'loadSpoken','reader-page-previous':'previousPage','reader-page-next':'nextPage'};
    Object.entries(spans).forEach(([id,key])=>{const span=$(id)?.querySelector('span');if(span)span.textContent=t(key);});
    $('reader-focus').querySelector('span').textContent=t(state.focus?'exitFocus':'focus');
    $('reader-surah-search').placeholder=t('findSurah');$('reader-surah-search').setAttribute('aria-label',t('findSurah'));
    renderEditionSelectors();
    $('reader-font-minus').setAttribute('aria-label',t('fontSmaller'));$('reader-font-plus').setAttribute('aria-label',t('fontLarger'));
    $('reader-reading-layout').setAttribute('aria-label',t('readingLayout'));$('reader-audio-settings-toggle').setAttribute('aria-label',t('audioSettings'));$('reader-audio-settings').setAttribute('aria-label',t('audioSettings'));
    setAudioSettings(state.audioSettings);
    $('reader-audio-previous').setAttribute('aria-label',t('previous'));$('reader-audio-next').setAttribute('aria-label',t('next'));
    $('reader-audio-seek').setAttribute('aria-label',t('audioPosition'));$('reader-follow').checked=!!state.follow;$('reader-follow').nextElementSibling.textContent=t('autoFollow');
    $('reader-note-close').setAttribute('aria-label',t('close'));$('reader-note-collection').placeholder=t('collectionHint');
    $('reader-qari').innerHTML=reciters().map(q=>`<option value="${escape(q.id)}">${escape(q.label)}</option>`).join('');$('reader-qari').value=state.qariId;renderAudioSelectors();
    $('reader-audio-rate').value=state.rate;$('reader-repeat').value=state.repeats;
    updatePlayButton();updateHifzRevealButton();
  }
  function renderEditionSelectors(){
    if(!root)return;const languages=[...new Set(['en','ur','ar',...catalogEntries('translations').map(e=>e.language)])].filter(code=>typeof code==='string'&&/^[a-z]{2,3}(?:-[a-z]+)?$/i.test(code));
    if(!languages.includes(state.translation))state.translation='en';
    $('reader-translation').innerHTML=languages.map(code=>`<option value="${escape(code)}">${escape(languageLabel(code))}</option>`).join('');$('reader-translation').value=state.translation;
    const options=translationEditions(state.translation);if(state.translation!=='ar'&&!options.some(e=>e.id===state.translationEdition))state.translationEdition=options[0]?.id||'';
    $('reader-translation-edition').innerHTML=state.translation==='ar'?`<option value="">${t('arabicOnly')}</option>`:options.map(e=>`<option value="${escape(e.id)}">${escape(e.label||e.author||e.id)}</option>`).join('');$('reader-translation-edition').value=state.translation==='ar'?'':state.translationEdition;$('reader-translation-edition').disabled=state.translation==='ar';
    const tafsirs=catalogEntries('tafsirs');if(state.tafsirEdition!=='none'&&!tafsirs.some(e=>e.id===state.tafsirEdition))state.tafsirEdition='none';
    $('reader-tafsir-edition').innerHTML=`<option value="none">${t('noTafsir')}</option>`+tafsirs.map(e=>`<option value="${escape(e.id)}">${escape(languageLabel(e.language))} · ${escape(e.label||e.author||e.id)}</option>`).join('');$('reader-tafsir-edition').value=state.tafsirEdition;
    updateSourceState();
  }
  function renderAudioSelectors(){
    if(!root)return;$('reader-audio-mode').innerHTML=`<option value="recitation">${t('recitationMode')}</option><option value="translation">${t('translationAudioMode')}</option>`;$('reader-audio-mode').value=state.audioMode;
    const rows=catalogEntries('audioTranslations');const languages=[...new Set([...catalogEntries('translations').map(e=>e.language),...rows.map(e=>e.language),'en','ur'])].filter(code=>typeof code==='string'&&code!=='ar');if(!languages.includes(state.audioLanguage))state.audioLanguage='en';
    $('reader-audio-language').innerHTML=languages.map(code=>`<option value="${escape(code)}">${escape(languageLabel(code))}</option>`).join('');$('reader-audio-language').value=state.audioLanguage;
    const editions=rows.filter(e=>e.language===state.audioLanguage);if(!editions.some(e=>e.id===state.audioEdition))state.audioEdition=editions[0]?.id||'';
    $('reader-audio-edition').innerHTML=editions.length?editions.map(e=>`<option value="${escape(e.id)}">${escape(e.label||e.author||e.id)}</option>`).join(''):`<option value="">${t('noSpoken')}</option>`;$('reader-audio-edition').value=state.audioEdition;$('reader-audio-edition').disabled=!editions.length;
    const translated=state.audioMode==='translation';$('reader-qari-field').hidden=translated;$('reader-audio-language-field').hidden=!translated;$('reader-audio-edition-field').hidden=!translated;$('reader-load-spoken').hidden=!translated;
    const row=rows.find(e=>e.id===state.audioEdition);const source=translated?webLink(row?.sourceUrl):'https://everyayah.com/';$('reader-audio-source').href=source||'#';$('reader-audio-source').hidden=!source;$('reader-audio-source').textContent=translated?[t('spokenSource'),row?.author||row?.label||t('noSpoken')].join(' · '):t('audioSource');$('reader-load-spoken').disabled=translated&&(!row||!!audioController);
  }
  function updateSourceState(){
    if(!root)return;const edition=selectedTranslation(),record=translationRecord();const builtin=state.translationEdition.startsWith('builtin:')&&Array.isArray(pack()[state.surahId])&&pack()[state.surahId].some(v=>state.translation==='en'?v.translation_en:v.translation_ur);
    $('reader-selected-source').textContent=state.translation==='ar'?[t('selectedSource'),arabicRecord()?.edition?.label||sources().arabic||t('arabicOnly')].join(' · '):[t('selectedSource'),edition?.label||edition?.author||t('sourceUnavailable')].join(' · ');
    $('reader-load-selection').disabled=!!readingJob;$('reader-load-selection').querySelector('span').textContent=t(readingJob?'loadingSelection':'loadSelection');$('reader-cancel-selection').hidden=!readingJob;
    $('reader-edition-status').textContent=readingJob?t('loadingSelection'):state.translation==='ar'&&verses().length?t(arabicRecord()?.persisted===false?'textMemory':'textOffline'):record?.complete?[t('translationReady'),t(record.persisted?'textOffline':'textMemory')].join(' · '):builtin?t('textOffline'):t('loadToRead');
    const tafsir=tafsirRecord();$('reader-load-tafsir').disabled=!!tafsirJob||state.tafsirEdition==='none';$('reader-cancel-tafsir').hidden=!tafsirJob;$('reader-tafsir-status').textContent=tafsirJob?t('loadingSelection'):tafsir?`${t('tafsirCoverage')}: ${tafsir.coverage?.length||0}/${s()?.total_verses||0} · ${t(tafsir.persisted?'textOffline':'textMemory')}`:'';
    $('reader-refresh-catalog').disabled=!!catalogJob;$('reader-refresh-catalog').querySelector('span').textContent=t(catalogJob?'catalogLoading':'refreshCatalog');
  }
  function renderStudyPage(){
    if(!root||!s())return;const study=globalThis.STUDY?.[state.surahId],intro=study?.introduction||s().overview||'';
    $('reader-study-page').innerHTML=`<details><summary>${icon('book')}<span>${t('studyTitle')}</span></summary><div><p>${escape(intro)}</p>${study?.readingGuide?.length?`<h3>${t('studyGuide')}</h3><ul>${study.readingGuide.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>`:''}${study?.reflectionPrompts?.length?`<h3>${t('reflectionPrompts')}</h3><ul>${study.reflectionPrompts.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>`:''}${s().themes?.length?`<div class="reader-study-themes">${s().themes.map(item=>`<span>${escape(item)}</span>`).join('')}</div>`:''}<p class="reader-study-note">${escape(study?.note||t('sourceCatalogNote'))}</p></div></details>`;
  }
  function validTextRecord(record,chapter){const count=globalThis.SURAHS?.[chapter-1]?.total_verses;return record?.surahId===chapter&&record.complete===true&&Array.isArray(record.ayahs)&&record.ayahs.length===count&&record.ayahs.every((row,i)=>row.number===i+1&&typeof row.text==='string'&&row.text.trim());}
  function cancelSourceLoads(kind){for(const name of kind?[kind]:['reading','tafsir','catalog']){const job=name==='reading'?readingJob:name==='tafsir'?tafsirJob:catalogJob;if(job)job.controller.abort();if(name==='reading')readingJob=null;else if(name==='tafsir')tafsirJob=null;else catalogJob=null;}updateSourceState();}
  async function loadReadingSelection(){
    if(!content()?.loadArabic){announce(t('sourceUnavailable'));return;}cancelSourceLoads('reading');
    if(state.translation!=='ar'&&state.translationEdition.startsWith('builtin:')&&!pack()[state.surahId]?.some(v=>state.translation==='en'?v.translation_en:v.translation_ur)){const choices=catalogEntries('translations').filter(e=>e.language===state.translation);const preferred=choices.find(e=>/sahih|jalandhry/i.test(e.id+' '+e.label))||choices[0];if(preferred){state.translationEdition=preferred.id;saveSetting('translation-edition',preferred.id);renderEditionSelectors();}}
    const job={token:++contentSequence,chapter:state.surahId,edition:state.translationEdition,language:state.translation,controller:new AbortController()};readingJob=job;updateSourceState();let arabic=null;
    try{
      if(!verses().length){arabic=await content().loadArabic(job.chapter,{signal:job.controller.signal});if(!validTextRecord(arabic,job.chapter))throw new Error(t('sourceUnavailable'));}
      let translated=null;if(job.language!=='ar'&&!job.edition.startsWith('builtin:')){translated=await content().loadTranslation(job.edition,job.chapter,{signal:job.controller.signal});if(!validTextRecord(translated,job.chapter)||translated.edition?.id!==job.edition)throw new Error(t('sourceUnavailable'));}
      if(readingJob!==job||job.controller.signal.aborted||state.surahId!==job.chapter||state.translationEdition!==job.edition||state.translation!==job.language)return;
      if(arabic)loadedArabic.set(job.chapter,arabic);if(translated)loadedTranslations.set(editionKey(job.edition,job.chapter),translated);renderText();renderStudyPage();announce(t('translationReady'));
    }catch(error){if(readingJob===job&&!job.controller.signal.aborted){if(arabic)loadedArabic.set(job.chapter,arabic);renderText();announce(error.message||t('loadFailed'));}}
    finally{if(readingJob===job){readingJob=null;updateSourceState();}}
  }
  async function loadSelectedTafsir(){
    if(!content()?.loadTafsir||state.tafsirEdition==='none'){announce(t('sourceUnavailable'));return;}cancelSourceLoads('tafsir');const job={chapter:state.surahId,edition:state.tafsirEdition,controller:new AbortController()};tafsirJob=job;updateSourceState();
    try{const record=await content().loadTafsir(job.edition,job.chapter,{signal:job.controller.signal});if(record?.surahId!==job.chapter||record.edition?.id!==job.edition||!Array.isArray(record.entries))throw new Error(t('sourceUnavailable'));if(tafsirJob!==job||job.controller.signal.aborted||state.surahId!==job.chapter||state.tafsirEdition!==job.edition)return;loadedTafsirs.set(editionKey(job.edition,job.chapter),record);renderText();renderTafsirBook();}
    catch(error){if(tafsirJob===job&&!job.controller.signal.aborted)announce(error.message||t('loadFailed'));}
    finally{if(tafsirJob===job){tafsirJob=null;updateSourceState();}}
  }
  async function refreshCatalog(){if(!content()?.discover){announce(t('sourceUnavailable'));return;}cancelSourceLoads('catalog');const job={controller:new AbortController()};catalogJob=job;updateSourceState();try{await content().discover({signal:job.controller.signal});if(catalogJob!==job||job.controller.signal.aborted)return;catalogSnapshot=content().getCatalog();renderEditionSelectors();renderAudioSelectors();}catch(error){if(catalogJob===job&&!job.controller.signal.aborted)announce(error.message||t('sourceUnavailable'));}finally{if(catalogJob===job){catalogJob=null;updateSourceState();}}}
  function tafsirEntry(ayah){return tafsirRecord()?.entries?.find(entry=>Array.isArray(entry.ayahs)&&entry.ayahs.includes(ayah));}
  function tafsirMarkup(ayah){if(!state.tafsirShown.has(ayah)||state.tafsirEdition==='none')return '';const record=tafsirRecord(),entry=tafsirEntry(ayah),edition=record?.edition||catalogEntries('tafsirs').find(e=>e.id===state.tafsirEdition);const link=webLink(edition?.sourceUrl);return `<section class="reader-inline-tafsir"><div class="reader-tafsir-attribution"><strong>${escape(edition?.label||edition?.author||t('tafsirEdition'))}</strong><span>${escape(entry?.reference||`${state.surahId}:${ayah}`)}</span></div><p lang="${escape(edition?.language||'en')}" dir="${textDirection(edition?.language)}">${escape(entry?plainText(entry.text):tafsirJob?t('loadingSelection'):t('tafsirMissing'))}</p>${link?`<a href="${escape(link)}" target="_blank" rel="noopener noreferrer">${t('linkedSource')} ↗</a>`:''}</section>`;}
  function renderTafsirBook(){if(!root)return;const record=tafsirRecord();$('reader-tafsir-book').hidden=!record||!record.entries?.length;if(!record?.entries?.length){$('reader-tafsir-book').innerHTML='';return;}const edition=record.edition;const link=webLink(edition?.sourceUrl);$('reader-tafsir-book').innerHTML=`<details><summary>${icon('book')}<span>${t('tafsirBook')} · ${escape(edition?.label||edition?.author||'')}</span></summary><div class="reader-tafsir-book-content">${record.entries.map(entry=>`<article><h3>${escape(entry.reference||entry.ayahs?.join(', ')||'')}</h3><p lang="${escape(edition?.language||'en')}" dir="${textDirection(edition?.language)}">${escape(plainText(entry.text))}</p></article>`).join('')}${link?`<a href="${escape(link)}" target="_blank" rel="noopener noreferrer">${t('linkedSource')} ↗</a>`:''}</div></details>`;}
  function renderSidebar(){
    if(!root)return;const query=normalize($('reader-surah-search').value||'');
    const list=(globalThis.SURAHS||[]).filter(chapter=>!query||normalize(`${chapter.id} ${chapter.name} ${chapter.transliteration} ${chapter.translation}`).includes(query));
    $('reader-surah-list').innerHTML=list.length?list.map(chapter=>{const st=status(chapter.id);return `<button class="reader-surah-option ${chapter.id===state.surahId?'is-current':''}" data-reader-surah="${chapter.id}" ${chapter.id===state.surahId?'aria-current="true"':''}><span class="reader-side-number">${String(chapter.id).padStart(3,'0')}</span><span><strong dir="ltr">${escape(chapter.transliteration)}</strong><small>${chapter.total_verses} ${t('ayahs')} · ${t(chapter.type)}</small></span><span class="reader-side-state ${st.status==='completed'?'is-complete':''}" title="${t(st.status)}">${st.status==='completed'?icon('check'):st.status==='reading'?'<i></i>':''}</span></button>`;}).join(''):`<p class="reader-no-results">${t('noSearch')}</p>`;
  }
  function renderChapter(){
    const chapter=s();if(!chapter||!root)return;
    applyLanguage();
    $('reader-chapter-kicker').textContent=`${t('surah')} ${state.surahId} / 114`;
    $('reader-surah-title').textContent=chapter.transliteration;$('reader-surah-meaning').textContent=chapter.translation;$('reader-surah-arabic').textContent=chapter.name;
    const juz=chapter.juz[0]===chapter.juz[1]?chapter.juz[0]:`${chapter.juz[0]}–${chapter.juz[1]}`;
    $('reader-chapter-meta').textContent=`${t(chapter.type)} · ${chapter.total_verses} ${t('ayahs')} · ${t('juz')} ${juz}`;
    $('reader-jump').innerHTML=Array.from({length:chapter.total_verses},(_,i)=>`<option value="${i+1}">${t('ayah')} ${i+1}</option>`).join('');$('reader-jump').value=state.ayah;
    for(const id of ['reader-range-start','reader-range-end'])$(id).max=chapter.total_verses;
    $('reader-range-start').value=state.start;$('reader-range-end').value=state.end;
    if(!$('reader-revision-date').value)$('reader-revision-date').value=dateAfter(7);
    $('reader-read-tab').setAttribute('aria-selected',state.mode==='read');$('reader-hifz-tab').setAttribute('aria-selected',state.mode==='hifz');$('reader-hifz-panel').hidden=state.mode!=='hifz';
    $('reader-text').setAttribute('aria-labelledby',state.mode==='hifz'?'reader-hifz-tab':'reader-read-tab');
    $('reader-text').style.setProperty('--reader-arabic-size',state.fontSize+'px');$('reader-font-size').textContent=state.fontSize;
    $('reader-previous-surah').disabled=state.surahId===1;$('reader-next-surah').disabled=state.surahId===114;$('reader-bottom-position').textContent=`${state.surahId} / 114`;
    renderStudyPage();renderText();renderTafsirBook();updateProgress();renderSidebar();updateAudioLabel();refreshAudioStatus();updateSourceState();updateDockHeight();
  }
  function renderText(){
    observer?.disconnect();
    const list=verses();
    const paged=state.mode==='read'&&state.layout==='pages';root.dataset.readerLayout=paged?'pages':'ayahs';
    $('reader-reading-layout').hidden=state.mode==='hifz';$('reader-layout-pages').setAttribute('aria-pressed',state.layout==='pages');$('reader-layout-ayahs').setAttribute('aria-pressed',state.layout==='ayahs');
    $('reader-page-navigation').hidden=!paged||!list.length;$('reader-pagination-note').hidden=!paged||!list.length;
    if(!list.length){$('reader-text').innerHTML=`<div class="reader-pack-empty">${icon('book')}<h3>${t('packTitle')}</h3><p>${t('loadToRead')}</p>${content()?.loadArabic?`<button class="primary-button reader-load-chapter" id="reader-load-chapter">${icon('download')}${t('chapterArabic')}</button>`:''}<p>${t('packText')}</p><div><button class="primary-button" id="reader-download-text">${icon('download')}${t('downloadPack')}</button><button class="secondary-button" id="reader-import-text">${t('importPack')}</button></div></div>`;$('reader-text-source').textContent='';$('reader-download-text').addEventListener('click',downloadText);$('reader-import-text').addEventListener('click',()=>globalThis.CompassApp?.importPack?.());$('reader-load-chapter')?.addEventListener('click',loadReadingSelection);return;}
    const visible=state.mode==='hifz'?list.filter(v=>v.id>=state.start&&v.id<=state.end):list;
    const bismillah=state.mode==='read'&&state.surahId!==1&&state.surahId!==9?'<div class="reader-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>':'';
    const st=status(state.surahId);const saved=bookmarks();
    if(paged)renderReadingPage(list,st,saved,bismillah);
    else $('reader-text').innerHTML=bismillah+visible.map(v=>renderAyah(v,st,saved)).join('')+`<div class="reader-end-note">${icon('book')}<p>${state.mode==='read'?t('atEnd'):`${t('loop')} ${state.start}–${state.end}`}</p></div>`;
    const source=sources();const edition=state.translation==='ar'?'':selectedTranslation()?.label||selectedTranslation()?.author||'';
    $('reader-text-source').textContent=[Array.isArray(pack()[state.surahId])?source.arabic||'Imported Quran text':arabicRecord()?.edition?.label||'Arabic Quran text',edition,t('sourcedTafsir')].filter(Boolean).join(' · ');
    observePosition();updateHifzRevealButton();
  }
  function renderAyah(v,st,saved,inPage=false){
      const bm=saved.find(b=>b.surahId===state.surahId&&b.ayah===v.id);const hidden=state.mode==='hifz'&&!state.revealed.has(v.id);
      const translated=translatedText(v);
      return `<article class="${inPage?'reader-page-ayah-detail':'reader-ayah'} ${hidden?'is-hidden-ayah':''} ${v.id===state.ayah?'is-active-ayah':''}" id="${inPage?'reader-page-detail-':'reader-ayah-'}${v.id}" ${inPage?'':`data-ayah="${v.id}"`}><div class="reader-ayah-top"><span class="reader-ayah-reference" dir="ltr">${state.surahId}:${v.id}</span><div class="reader-ayah-tools"><button class="icon-button" data-reader-play="${v.id}" aria-label="${t('playAyah')} ${v.id}">${icon('play')}</button><button class="icon-button ${bm?'is-bookmarked':''}" data-reader-bookmark="${v.id}" aria-label="${t(bm?'unbookmark':'bookmark')} ${v.id}" aria-pressed="${!!bm}">${icon('bookmark')}</button><button class="icon-button ${bm?.note?'has-note':''}" data-reader-note="${v.id}" aria-label="${t('note')} ${v.id}">${icon('note')}</button><button class="icon-button" data-reader-copy="${v.id}" aria-label="${t('copy')} ${v.id}">${icon('copy')}</button></div></div><div class="reader-ayah-content" ${hidden?'hidden':''}>${inPage?'':`<p class="reader-arabic" lang="ar" dir="rtl">${escape(v.text)}</p>`}${state.translation!=='ar'?`<p class="reader-translation-text" lang="${escape(state.translation)}" dir="${textDirection(state.translation)}">${escape(translated||t(state.translationEdition.startsWith('builtin:')?'noTranslation':'loadToRead'))}</p>`:''}</div>${state.mode==='hifz'?`<button class="reader-reveal-ayah" data-reader-reveal="${v.id}">${icon('eye')}<span>${t(hidden?'revealAyah':'hideAyah')}</span></button>${hidden?`<p class="reader-recall-hint">${t('hiddenAyah')}</p>`:''}`:''}<div class="reader-ayah-bottom"><label class="reader-read-check"><input type="checkbox" data-reader-read="${v.id}" ${st.readAyahs.includes(v.id)?'checked':''} ${st.readAyahs.includes(v.id)?'disabled':''}><span>${t('read')}</span></label>${state.mode==='hifz'?`<label class="reader-memorized-check"><input type="checkbox" data-reader-memorized="${v.id}" ${st.memorizedAyahs.includes(v.id)?'checked':''}><span>${t('memorized')}</span></label>`:''}<button class="reader-tafsir-toggle" data-reader-tafsir="${v.id}" aria-expanded="${state.tafsirShown.has(v.id)}">${t(state.tafsirShown.has(v.id)?'hideTafsir':'showTafsir')}</button><a class="reader-tafsir-link" href="https://quran.com/${state.surahId}:${v.id}/tafsirs/en-tafisr-ibn-kathir" target="_blank" rel="noopener noreferrer">${t('tafsir')} ↗</a></div>${tafsirMarkup(v.id)}${bm?.note?`<button class="reader-inline-note" data-reader-note="${v.id}">${icon('note')}<span>${escape(bm.note.length>160?bm.note.slice(0,160)+'…':bm.note)}</span></button>`:''}</article>`;
  }
  // Reader pages retain whole verses. They do not claim the pagination of a printed Mushaf.
  function readingPages(list=verses()){
    const pages=[];let page=[],length=0;
    for(const verse of list){const weight=Array.from(String(verse.text).replace(/\p{M}/gu,'')).length+24;
      if(page.length&&(length+weight>1400||page.length>=18)){pages.push(page);page=[];length=0;}
      page.push(verse);length+=weight;
    }
    if(page.length)pages.push(page);return pages;
  }
  function pageContaining(ayah,pages=readingPages()){const index=pages.findIndex(page=>page.some(v=>v.id===Number(ayah)));return Math.max(0,index);}
  function renderReadingPage(list,st,saved,bismillah){
    const pages=readingPages(list);state.page=pageContaining(state.ayah,pages);const page=pages[state.page],first=page[0].id,last=page[page.length-1].id;
    $('reader-page-position').textContent=`${t('page')} ${state.page+1} / ${pages.length} · ${t('ayah')} ${first}–${last}`;
    $('reader-page-previous').disabled=state.page===0;$('reader-page-next').disabled=state.page===pages.length-1;
    $('reader-text').innerHTML=`<div class="reader-mushaf-page"><div class="reader-mushaf-heading"><span lang="ar" dir="rtl">${escape(s().name)}</span><span>${t('page')} ${state.page+1}</span></div>${state.page===0?bismillah:''}<div class="reader-page-flow" lang="ar" dir="rtl">${page.map(v=>`<span class="reader-ayah reader-page-verse ${v.id===state.ayah?'is-active-ayah':''}" id="reader-ayah-${v.id}" data-ayah="${v.id}">${escape(v.text)} <button class="reader-ayah-marker" data-reader-detail="${v.id}" aria-label="${t('showAyahTools')} ${state.surahId}:${v.id}" aria-controls="reader-page-detail-${v.id}">${String(v.id).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)])}</button></span>`).join(' ')}</div><div class="reader-mushaf-folio">${first}–${last} · ${t('ayahs')}</div></div><details class="reader-page-study" id="reader-page-study" ${state.pageToolsOpen?'open':''}><summary>${icon('book')}<span>${t('pageTools')}</span></summary><div>${page.map(v=>renderAyah(v,st,saved,true)).join('')}</div></details>${state.page===pages.length-1?`<div class="reader-end-note">${icon('book')}<p>${t('atEnd')}</p></div>`:''}<div class="reader-page-bottom-controls"><button class="secondary-button" data-reader-page="previous" ${state.page===0?'disabled':''}>${t('previousPage')}</button><span>${state.page+1} / ${pages.length}</span><button class="secondary-button" data-reader-page="next" ${state.page===pages.length-1?'disabled':''}>${t('nextPage')}</button></div>`;
    $('reader-page-study').addEventListener('toggle',()=>{state.pageToolsOpen=$('reader-page-study').open;});
  }
  function turnReadingPage(delta){
    if(state.mode!=='read'||state.layout!=='pages')return;const pages=readingPages(),index=state.page+delta;if(index<0||index>=pages.length)return;
    state.pageToolsOpen=false;setPosition(pages[index][0].id);
  }
  function updateProgress(){
    if(!root||!s())return;const st=status(state.surahId),read=st.readAyahs.length,total=s().total_verses;
    $('reader-progress-count').textContent=`${read} / ${total} ${t('ayahs')}`;$('reader-progress-fill').style.width=`${read/total*100}%`;
    root.querySelector('.reader-progress-track')?.setAttribute('aria-valuenow',Math.round(read/total*100));
    $('reader-mark-complete').disabled=st.status==='completed';$('reader-mark-complete').querySelector('span').textContent=t(st.status==='completed'?'completed':'markComplete');
    root.querySelectorAll('[data-reader-read]').forEach(input=>{const yes=st.readAyahs.includes(Number(input.dataset.readerRead));input.checked=yes;input.disabled=yes;input.setAttribute('aria-label',`${t('readCheckbox')} ${input.dataset.readerRead}`);});
    root.querySelectorAll('[data-reader-memorized]').forEach(input=>{input.checked=st.memorizedAyahs.includes(Number(input.dataset.readerMemorized));});
    const saved=bookmarks();root.querySelectorAll('[data-reader-bookmark]').forEach(button=>{const yes=saved.some(b=>b.surahId===state.surahId&&b.ayah===Number(button.dataset.readerBookmark));button.classList.toggle('is-bookmarked',yes);button.setAttribute('aria-pressed',yes);button.setAttribute('aria-label',`${t(yes?'unbookmark':'bookmark')} ${button.dataset.readerBookmark}`);});
  }
  function observePosition(){
    if(typeof IntersectionObserver!=='function'||state.mode==='hifz')return;
    observer=new IntersectionObserver(entries=>{if(!isVisible()||audioLoading||(audio&&!audio.paused))return;const candidate=entries.filter(e=>e.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top-150)-Math.abs(b.boundingClientRect.top-150))[0];if(candidate){const id=Number(candidate.target.dataset.ayah);if(id>0&&id!==state.ayah){state.ayah=id;$('reader-jump').value=id;clearTimeout(lastPositionTimer);const chapter=state.surahId;lastPositionTimer=setTimeout(()=>{if(chapter===state.surahId)store()?.setLastRead?.(chapter,id);},400);if(!audioAyah)updateAudioLabel();}}},{root:state.focus?root:null,rootMargin:'-100px 0px -60% 0px',threshold:0});
    root.querySelectorAll('.reader-ayah').forEach(element=>observer.observe(element));
  }
  function scrollToAyah(ayah,behavior='smooth'){
    if(state.mode==='read'&&state.layout==='pages'&&pageContaining(ayah)!==state.page){state.ayah=Number(ayah);renderText();}
    const element=$('reader-ayah-'+ayah);if(element){const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;element.scrollIntoView({block:'start',behavior:reduced?'auto':behavior});}
  }
  function setPosition(ayah,scroll=true){const value=Math.max(1,Math.min(s()?.total_verses||1,Number(ayah)||1));state.ayah=value;$('reader-jump').value=value;store()?.setLastRead?.(state.surahId,value);if(state.mode==='read'&&state.layout==='pages'&&pageContaining(value)!==state.page)renderText();if(scroll)scrollToAyah(value);root?.querySelectorAll('.reader-ayah').forEach(element=>element.classList.toggle('is-active-ayah',Number(element.dataset.ayah)===value));updateAudioLabel();}
  function open(surahId,ayah=1){
    if(!ensureShell())return;const id=Number(surahId);if(!Number.isInteger(id)||id<1||id>114)return;
    const change=id!==state.surahId;if(change){cancelSourceLoads();stopAudio();state.surahId=id;state.page=0;state.pageToolsOpen=false;state.start=1;state.end=Math.min(7,s().total_verses);state.revealed.clear();state.tafsirShown.clear();state.practice=false;state.round=0;}
    state.ayah=Math.max(1,Math.min(s().total_verses,Number(ayah)||1));renderChapter();store()?.setLastRead?.(id,state.ayah);
    if(state.ayah>1){if(state.mode==='hifz'&&(state.ayah<state.start||state.ayah>state.end)){state.start=state.ayah;state.end=Math.min(s().total_verses,state.ayah+4);state.revealed.clear();renderChapter();}setTimeout(()=>{if(isVisible())scrollToAyah(state.ayah,'auto');},0);}
    else if(change&&isVisible())root.scrollIntoView({block:'start',behavior:'auto'});
  }
  function refresh(){
    if(!ensureShell())return;
    const values={};for(const [key,raw] of Object.entries(getPreferences())){const short=key.slice('compass-reader-'.length);values[key]=loadSetting(short,JSON.parse(raw));}restorePreferenceValues(values,false);
    if($('reader-note-dialog')?.open){updateProgress();return;}renderChapter();
  }
  async function downloadText(){const button=$('reader-download-text');if(button){button.disabled=true;button.textContent=t('packBusy');}try{await globalThis.CompassApp?.downloadPack?.();}finally{refresh();}}
  function changeMode(mode){state.mode=mode;state.practice=false;state.round=0;state.revealed.clear();stopAudio();if(mode==='hifz'&&(state.ayah<state.start||state.ayah>state.end))state.ayah=state.start;renderChapter();}
  function changeRange(){state.start=Math.max(1,Math.min(s().total_verses,Number($('reader-range-start').value)||1));state.end=Math.max(state.start,Math.min(s().total_verses,Number($('reader-range-end').value)||state.start));state.revealed.clear();state.practice=false;state.round=0;stopAudio();$('reader-range-start').value=state.start;$('reader-range-end').value=state.end;renderText();setPosition(state.start,false);}
  function isRangeRevealed(){for(let id=state.start;id<=state.end;id++)if(!state.revealed.has(id))return false;return true;}
  function updateHifzRevealButton(){if(!$('reader-reveal-all'))return;$('reader-reveal-all').querySelector('span').textContent=t(isRangeRevealed()?'hide':'reveal');}
  function openNote(ayah){bookmarkAyah=Number(ayah);const existing=bookmarks().find(b=>b.surahId===state.surahId&&b.ayah===bookmarkAyah);$('reader-note-reference').textContent=`${s().transliteration} · ${state.surahId}:${bookmarkAyah}`;$('reader-note-text').value=existing?.note||'';$('reader-note-collection').value=existing?.collection||'General';$('reader-collection-list').innerHTML=[...new Set(['General',...bookmarks().map(b=>b.collection||'General')])].map(name=>`<option value="${escape(name)}"></option>`).join('');$('reader-note-delete').hidden=!existing;$('reader-note-dialog').showModal();document.body.classList.add('has-dialog');$('reader-note-text').focus();}
  function bindEvents(){
    $('reader-layout-pages').addEventListener('click',()=>{state.layout='pages';saveSetting('layout',state.layout);renderText();});$('reader-layout-ayahs').addEventListener('click',()=>{state.layout='ayahs';saveSetting('layout',state.layout);renderText();});
    $('reader-page-previous').addEventListener('click',()=>turnReadingPage(-1));$('reader-page-next').addEventListener('click',()=>turnReadingPage(1));
    $('reader-audio-settings-toggle').addEventListener('click',()=>setAudioSettings(!state.audioSettings));
    $('reader-audio-settings').addEventListener('keydown',event=>{if(event.key==='Escape'&&state.audioSettings){event.preventDefault();event.stopPropagation?.();setAudioSettings(false);$('reader-audio-settings-toggle').focus();}});
    $('reader-surah-search').addEventListener('input',renderSidebar);
    $('reader-surah-list').addEventListener('click',event=>{const button=event.target.closest('[data-reader-surah]');if(button){const id=Number(button.dataset.readerSurah);if(globalThis.CompassApp?.navigate)globalThis.CompassApp.navigate('reader',{surahId:id,ayah:status(id).lastAyah||1});else open(id,status(id).lastAyah||1);}});
    $('reader-overview').addEventListener('click',()=>globalThis.CompassApp?.openSurah?.(state.surahId));
    $('reader-translation').addEventListener('change',()=>{cancelSourceLoads('reading');state.translation=$('reader-translation').value;state.translationEdition=translationEditions(state.translation)[0]?.id||'';saveSetting('translation',state.translation);saveSetting('translation-edition',state.translationEdition);renderEditionSelectors();renderText();});
    $('reader-translation-edition').addEventListener('change',()=>{const id=$('reader-translation-edition').value;if(!translationEditions(state.translation).some(e=>e.id===id))return;cancelSourceLoads('reading');state.translationEdition=id;saveSetting('translation-edition',id);renderText();updateSourceState();});
    $('reader-load-selection').addEventListener('click',loadReadingSelection);$('reader-cancel-selection').addEventListener('click',()=>cancelSourceLoads('reading'));$('reader-refresh-catalog').addEventListener('click',refreshCatalog);
    $('reader-tafsir-edition').addEventListener('change',()=>{const id=$('reader-tafsir-edition').value;if(id!=='none'&&!catalogEntries('tafsirs').some(e=>e.id===id))return;cancelSourceLoads('tafsir');state.tafsirEdition=id;state.tafsirShown.clear();saveSetting('tafsir-edition',id);renderText();renderTafsirBook();updateSourceState();});
    $('reader-load-tafsir').addEventListener('click',loadSelectedTafsir);$('reader-cancel-tafsir').addEventListener('click',()=>cancelSourceLoads('tafsir'));
    $('reader-jump').addEventListener('change',()=>{const id=Number($('reader-jump').value);if(state.mode==='hifz'&&(id<state.start||id>state.end)){state.start=id;state.end=Math.min(s().total_verses,id+4);renderChapter();}setPosition(id);});
    $('reader-font-minus').addEventListener('click',()=>changeFont(-2));$('reader-font-plus').addEventListener('click',()=>changeFont(2));
    $('reader-read-tab').addEventListener('click',()=>changeMode('read'));$('reader-hifz-tab').addEventListener('click',()=>changeMode('hifz'));
    root.querySelector('.reader-mode-tabs').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const mode=event.key==='Home'?'read':event.key==='End'?'hifz':state.mode==='read'?'hifz':'read';changeMode(mode);$(mode==='read'?'reader-read-tab':'reader-hifz-tab').focus();}});
    $('reader-range-start').addEventListener('change',changeRange);$('reader-range-end').addEventListener('change',changeRange);$('reader-repeat').addEventListener('change',()=>{state.repeats=Number($('reader-repeat').value);});
    $('reader-reveal-all').addEventListener('click',()=>{const all=isRangeRevealed();state.revealed.clear();if(!all)for(let i=state.start;i<=state.end;i++)state.revealed.add(i);renderText();});
    $('reader-practice').addEventListener('click',()=>{state.practice=true;state.round=1;playAt(state.start);});
    $('reader-memorize-range').addEventListener('click',()=>{if(store()?.setMemorizedRange)store().setMemorizedRange(state.surahId,state.start,state.end,true);else for(let id=state.start;id<=state.end;id++)store()?.setMemorized?.(state.surahId,id,true);announce(t('markedRange'));});
    $('reader-schedule-revision').addEventListener('click',()=>{const date=$('reader-revision-date').value;if(date&&store()?.scheduleRevision){store().scheduleRevision(state.surahId,date,7);announce(t('revisionSaved'));}});
    $('reader-revised').addEventListener('click',()=>{store()?.markRevised?.(state.surahId);announce(t('revisionDone'));});
    $('reader-mark-complete').addEventListener('click',()=>{store()?.setStatus?.(state.surahId,'completed');announce(t('completeMessage'));});
    $('reader-text').addEventListener('click',async event=>{
      const page=event.target.closest('[data-reader-page]'),detail=event.target.closest('[data-reader-detail]');
      if(page){turnReadingPage(page.dataset.readerPage==='previous'?-1:1);return;}
      if(detail){const id=Number(detail.dataset.readerDetail);setPosition(id,false);state.pageToolsOpen=true;$('reader-page-study').open=true;$('reader-page-detail-'+id)?.scrollIntoView({block:'nearest',behavior:'auto'});return;}
      const play=event.target.closest('[data-reader-play]'),bookmark=event.target.closest('[data-reader-bookmark]'),note=event.target.closest('[data-reader-note]'),copy=event.target.closest('[data-reader-copy]'),reveal=event.target.closest('[data-reader-reveal]'),tafsir=event.target.closest('[data-reader-tafsir]');
      if(play){state.practice=false;state.round=0;await playAt(Number(play.dataset.readerPlay));}
      if(bookmark){const id=Number(bookmark.dataset.readerBookmark);const existing=bookmarks().find(b=>b.surahId===state.surahId&&b.ayah===id);if(existing?.note){openNote(id);announce(t('bookmarkWithNote'));}else{store()?.toggleBookmark?.(state.surahId,id);announce(t(existing?'bookmarkRemoved':'bookmarked'));updateProgress();}}
      if(note)openNote(Number(note.dataset.readerNote));
      if(copy){const id=Number(copy.dataset.readerCopy),v=verses().find(v=>v.id===id);if(v){const translated=translatedText(v);try{await navigator.clipboard.writeText([v.text,translated,`Quran ${state.surahId}:${id}`].filter(Boolean).join('\n'));announce(t('copied'));}catch{announce(t('copyFailed'));}}}
      if(reveal){const id=Number(reveal.dataset.readerReveal);state.revealed.has(id)?state.revealed.delete(id):state.revealed.add(id);renderText();}
      if(tafsir){const id=Number(tafsir.dataset.readerTafsir);if(state.tafsirShown.has(id)){state.tafsirShown.delete(id);renderText();}else{if(state.tafsirEdition==='none'){const choices=catalogEntries('tafsirs');const chosen=choices.find(e=>e.language===state.translation)||choices.find(e=>e.language==='en')||choices[0];if(!chosen){announce(t('sourceUnavailable'));return;}state.tafsirEdition=chosen.id;saveSetting('tafsir-edition',chosen.id);renderEditionSelectors();}const chapter=state.surahId,edition=state.tafsirEdition;state.tafsirShown.add(id);renderText();if(!tafsirRecord())await loadSelectedTafsir();if(state.surahId===chapter&&state.tafsirEdition===edition)renderText();}}
    });
    $('reader-text').addEventListener('change',event=>{if(event.target.matches('[data-reader-read]')&&event.target.checked){store()?.markRead?.(state.surahId,Number(event.target.dataset.readerRead));updateProgress();}if(event.target.matches('[data-reader-memorized]')){store()?.setMemorized?.(state.surahId,Number(event.target.dataset.readerMemorized),event.target.checked);updateProgress();}});
    $('reader-focus').addEventListener('click',toggleFocus);
    $('reader-previous-surah').addEventListener('click',()=>globalThis.CompassApp?.navigate?.('reader',{surahId:state.surahId-1,ayah:1}));$('reader-next-surah').addEventListener('click',()=>globalThis.CompassApp?.navigate?.('reader',{surahId:state.surahId+1,ayah:1}));
    $('reader-note-close').addEventListener('click',()=>$('reader-note-dialog').close());
    $('reader-note-dialog').addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('has-dialog');});
    $('reader-note-dialog').addEventListener('click',event=>{if(event.target===$('reader-note-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
    $('reader-note-form').addEventListener('submit',event=>{event.preventDefault();store()?.saveNote?.(state.surahId,bookmarkAyah,$('reader-note-text').value,$('reader-note-collection').value||'General');$('reader-note-dialog').close();renderText();announce(t('noteSaved'));});
    $('reader-note-delete').addEventListener('click',()=>{store()?.removeBookmark?.(`${state.surahId}:${bookmarkAyah}`);$('reader-note-dialog').close();renderText();announce(t('bookmarkRemoved'));});
    $('reader-audio-play').addEventListener('click',async()=>{if(audio&&!audio.paused){audio.pause();updatePlayButton();}else if(audio?.src&&audioAyah&&!audio.ended){try{await audio.play();updatePlayButton();}catch{announce(t('audioPlayError'));}}else playAt(state.ayah);});
    $('reader-audio-previous').addEventListener('click',()=>{state.practice=false;playAt(Math.max(state.mode==='hifz'?state.start:1,(audioAyah||state.ayah)-1));});$('reader-audio-next').addEventListener('click',()=>{state.practice=false;playAt(Math.min(state.mode==='hifz'?state.end:s().total_verses,(audioAyah||state.ayah)+1));});
    $('reader-qari').addEventListener('change',()=>{const id=$('reader-qari').value;if(!reciters().some(q=>q.id===id))return;stopAudio();state.qariId=id;saveSetting('qari',state.qariId);refreshAudioStatus();});
    $('reader-audio-mode').addEventListener('change',()=>{stopAudio();state.audioMode=$('reader-audio-mode').value==='translation'?'translation':'recitation';saveSetting('audio-mode',state.audioMode);renderAudioSelectors();updatePlayButton();refreshAudioStatus();});
    $('reader-audio-language').addEventListener('change',()=>{stopAudio();state.audioLanguage=$('reader-audio-language').value;state.audioEdition='';saveSetting('audio-language',state.audioLanguage);renderAudioSelectors();saveSetting('audio-edition',state.audioEdition);updatePlayButton();refreshAudioStatus();});
    $('reader-audio-edition').addEventListener('change',()=>{const id=$('reader-audio-edition').value;if(!catalogEntries('audioTranslations').some(e=>e.id===id&&e.language===state.audioLanguage))return;stopAudio();state.audioEdition=id;saveSetting('audio-edition',id);renderAudioSelectors();updatePlayButton();refreshAudioStatus();});
    $('reader-load-spoken').addEventListener('click',async()=>{stopAudio();const controller=new AbortController();audioController=controller;const chapter=state.surahId,edition=state.audioEdition;$('reader-load-spoken').disabled=true;try{await loadSpokenMetadata(edition,chapter,controller.signal);if(!controller.signal.aborted&&state.surahId===chapter&&state.audioEdition===edition){announce(t('audioMetadata'));refreshAudioStatus();}}catch(error){if(!controller.signal.aborted)announce(error.message||t('spokenUnavailable'));}finally{if(audioController===controller)audioController=null;renderAudioSelectors();}});
    $('reader-audio-rate').addEventListener('change',()=>{state.rate=Number($('reader-audio-rate').value);if(audio)audio.playbackRate=state.rate;saveSetting('rate',state.rate);});
    $('reader-follow').addEventListener('change',()=>{state.follow=$('reader-follow').checked;saveSetting('follow',state.follow);});
    $('reader-audio-seek').addEventListener('input',()=>{if(audio&&Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number($('reader-audio-seek').value)/100*audio.duration;});
    $('reader-audio-download').addEventListener('click',()=>{if(downloading)downloading.controller.abort();else downloadCurrentAudio();});
    $('reader-audio-remove').addEventListener('click',async()=>{const removed=await removeAudio(state.surahId,audioSourceKey());announce(t(removed?'audioRemoved':'audioRemoveError'));refreshAudioStatus();});
    document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&state.focus){state.focus=false;root.classList.remove('reader-focus-active');document.body.classList.remove('reader-has-focus');applyLanguage();}});
    document.addEventListener('keydown',event=>{if(!isVisible())return;if(event.key==='Escape'&&state.focus&&!$('reader-note-dialog').open){exitFocus();}});
  }
  function changeFont(delta){state.fontSize=Math.max(24,Math.min(48,state.fontSize+delta));$('reader-text').style.setProperty('--reader-arabic-size',state.fontSize+'px');$('reader-font-size').textContent=state.fontSize;saveSetting('font-size',state.fontSize);}
  function dateAfter(days){const date=new Date();date.setDate(date.getDate()+days);const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
  async function toggleFocus(){if(state.focus){await exitFocus();return;}state.focus=true;root.classList.add('reader-focus-active');document.body.classList.add('reader-has-focus');applyLanguage();if(root.requestFullscreen){try{await root.requestFullscreen();}catch{/* CSS focus mode remains useful when fullscreen permission is unavailable. */}}else announce(t('fullScreenUnavailable'));}
  async function exitFocus(){state.focus=false;root?.classList.remove('reader-focus-active');document.body.classList.remove('reader-has-focus');if(document.fullscreenElement===root&&document.exitFullscreen)try{await document.exitFullscreen();}catch{}applyLanguage();}
  function bindAudio(){
    audio.addEventListener('play',updatePlayButton);audio.addEventListener('pause',updatePlayButton);
    audio.addEventListener('loadedmetadata',()=>{$('reader-audio-duration').textContent=formatTime(audio.duration);});
    audio.addEventListener('timeupdate',()=>{if(!$('reader-audio-current'))return;$('reader-audio-current').textContent=formatTime(audio.currentTime);$('reader-audio-seek').value=audio.duration?Math.min(100,audio.currentTime/audio.duration*100):0;});
    audio.addEventListener('ended',()=>{
      if(!isVisible()){stopAudio();return;}
      const endedAyah=audioAyah||state.ayah;
      if(state.practice){if(endedAyah<state.end)playAt(endedAyah+1);else if(state.round<state.repeats){state.round++;playAt(state.start);}else{state.practice=false;updateAudioLabel();updatePlayButton();}}
      else if(state.mode==='read'&&endedAyah<s().total_verses)playAt(endedAyah+1);else updatePlayButton();
    });
    audio.addEventListener('error',()=>{updatePlayButton();if(isVisible()&&audio.src&&audio.error)announce(t('audioError'));});
  }
  function formatTime(value){if(!Number.isFinite(value)||value<0)return '0:00';return `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;}
  function updatePlayButton(){if(!$('reader-audio-play'))return;const playing=audio&&!audio.paused&&!audio.ended;$('reader-audio-play').innerHTML=icon(playing?'pause':'play');$('reader-audio-play').setAttribute('aria-label',t(playing?'pause':'play'));$('reader-audio-play').setAttribute('aria-pressed',!!playing);$('reader-audio-play').disabled=state.audioMode==='translation'&&!catalogEntries('audioTranslations').some(e=>e.id===state.audioEdition);}
  function updateAudioLabel(){if(!root||!s())return;const current=audioAyah||state.ayah;$('reader-audio-surah').textContent=s().transliteration;$('reader-audio-ayah').textContent=`${t('ayah')} ${current} / ${s().total_verses}${state.practice?` · ${t('round')} ${state.round}/${state.repeats}`:''}`;$('reader-audio-previous').disabled=current<=(state.mode==='hifz'?state.start:1);$('reader-audio-next').disabled=current>=(state.mode==='hifz'?state.end:s().total_verses);}
  function audioSourceKey(mode=state.audioMode,id=mode==='translation'?state.audioEdition:state.qariId){return mode==='translation'?`translation:${id}`:id;}
  function validSpokenRecord(record,id,chapter){
    const total=globalThis.SURAHS?.[chapter-1]?.total_verses,edition=record?.edition,configured=catalogEntries('audioTranslations').find(e=>e.id===id),source=edition?.sourceEdition||edition?.id;
    if(!configured||record?.surahId!==chapter||edition?.id!==id||edition.format!=='audio'||typeof edition.language!=='string'||edition.language==='ar'||edition.language!==configured.language||edition.sourceType!=='translation'||record.complete!==true||!Array.isArray(record.ayahs)||record.ayahs.length!==total||!source||source!==(configured.sourceEdition||configured.id))return false;
    const base=(globalThis.SURAHS||[]).slice(0,chapter-1).reduce((sum,surah)=>sum+surah.total_verses,0);
    return record.ayahs.every((row,i)=>{const parts=typeof row.url==='string'&&row.url.match(/^https:\/\/(?:cdn\.islamic\.network|islamic\.network)\/quran\/audio\/\d+\/([^/]+)\/(\d+)\.mp3(?:\?[^\s#]*)?$/);return row.number===i+1&&parts&&parts[1]===source&&Number(parts[2])===base+i+1;});
  }
  async function loadSpokenMetadata(id,chapter,signal){if(!id||!catalogEntries('audioTranslations').some(e=>e.id===id)||!content()?.loadAudioTranslation)throw new Error(t('noSpoken'));const existing=spokenRecord(id,chapter);if(validSpokenRecord(existing,id,chapter))return existing;const record=await content().loadAudioTranslation(id,chapter,{signal});if(!validSpokenRecord(record,id,chapter))throw new Error(t('spokenUnavailable'));if(signal?.aborted)throw new DOMException('Aborted','AbortError');loadedSpoken.set(editionKey(id,chapter),record);return record;}
  async function sourceURLs(mode,id,chapter,signal){if(mode==='translation'){const record=await loadSpokenMetadata(id,chapter,signal);return new Map(record.ayahs.map(row=>[row.number,row.url]));}const total=globalThis.SURAHS?.[chapter-1]?.total_verses||0;return new Map(Array.from({length:total},(_,i)=>[i+1,audioURL(chapter,i+1,id)]));}
  async function resolveAudioSource(surahId,ayah,mode,id,signal){const urls=await sourceURLs(mode,id,surahId,signal),url=urls.get(ayah);if(!vettedAudioURL(url))throw new Error(t('spokenUnavailable'));if('caches'in globalThis){try{const cache=await caches.open(AUDIO_CACHE);const response=await cache.match(url);if(response){const blob=await response.blob();return {url:URL.createObjectURL(blob),local:true};}}catch{}}return {url,local:false};}
  async function playAt(ayah){
    if(!audio||!s())return;const id=Math.max(1,Math.min(s().total_verses,Number(ayah)||1));const token=++audioToken;const chapter=state.surahId,mode=state.audioMode,selected=mode==='translation'?state.audioEdition:state.qariId;
    audioController?.abort();const controller=new AbortController();audioController=controller;audioLoading=true;audio.pause();audioAyah=id;setPosition(id,state.follow);
    try{const source=await resolveAudioSource(chapter,id,mode,selected,controller.signal);if(token!==audioToken||controller.signal.aborted||chapter!==state.surahId||mode!==state.audioMode||selected!==(mode==='translation'?state.audioEdition:state.qariId)){if(source.local)URL.revokeObjectURL(source.url);return;}if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}if(source.local)objectURL=source.url;audio.src=source.url;audio.playbackRate=state.rate;await audio.play();if(token!==audioToken)return;updatePlayButton();}
    catch(error){if(token===audioToken&&!controller.signal.aborted){audio.removeAttribute('src');audio.load();audioAyah=null;if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}updateAudioLabel();announce(mode==='translation'?(error.message||t('spokenUnavailable')):t('audioPlayError'));}}
    finally{if(token===audioToken)audioLoading=false;if(audioController===controller)audioController=null;}
  }
  function stopAudio(){audioToken++;audioController?.abort();audioController=null;audioAyah=null;audioLoading=false;if(audio){audio.pause();audio.removeAttribute('src');audio.load();}if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}state.practice=false;state.round=0;updatePlayButton();if(root){updateAudioLabel();if($('reader-audio-current'))$('reader-audio-current').textContent='0:00';if($('reader-audio-duration'))$('reader-audio-duration').textContent='0:00';if($('reader-audio-seek'))$('reader-audio-seek').value=0;}}
  function cachedAudioDetails(url){
    const recitation=url.match(/^https:\/\/everyayah\.com\/data\/([^/]+)\/(\d{3})(\d{3})\.mp3$/);if(recitation){const reciter=reciters().find(q=>q.path===recitation[1]),surahId=Number(recitation[2]),ayah=Number(recitation[3]),chapter=globalThis.SURAHS?.[surahId-1];if(reciter&&chapter&&ayah>=1&&ayah<=chapter.total_verses)return {surahId,ayah,qariId:reciter.id,qariLabel:reciter.label,mode:'recitation',language:'ar'};return null;}
    const spoken=url.match(/^https:\/\/(?:cdn\.islamic\.network|islamic\.network)\/quran\/audio\/[^/]+\/([^/]+)\/(\d+)\.mp3(?:\?[^#]*)?$/);if(spoken){const edition=catalogEntries('audioTranslations').find(e=>(e.sourceEdition||e.id)===spoken[1]);if(!edition)return null;const number=Number(spoken[2]);let base=0;for(const chapter of globalThis.SURAHS||[]){if(number>base&&number<=base+chapter.total_verses)return {surahId:chapter.id,ayah:number-base,qariId:`translation:${edition.id}`,qariLabel:edition.label||edition.author,mode:'translation',editionId:edition.id,language:edition.language};base+=chapter.total_verses;}}
    for(const record of loadedSpoken.values()){const row=record.ayahs?.find(v=>v.url===url);if(row)return {surahId:record.surahId,ayah:row.number,qariId:`translation:${record.edition.id}`,qariLabel:record.edition.label||record.edition.author,mode:'translation',editionId:record.edition.id,language:record.edition.language};}
    return null;
  }
  async function audioStatus(){
    if(!('caches'in globalThis))return {supported:false,totalFiles:0,totalBytes:0,packs:[]};
    try{
      const cache=await caches.open(AUDIO_CACHE);const requests=await cache.keys();const groups=new Map();let totalBytes=0,totalFiles=0;
      await Promise.all(requests.map(async request=>{const details=cachedAudioDetails(request.url);if(!details)return;const response=await cache.match(request),bytes=Number(response?.headers.get('content-length'))||0,key=`${details.surahId}:${details.qariId}`;if(!groups.has(key))groups.set(key,{...details,downloaded:0,total:globalThis.SURAHS[details.surahId-1].total_verses,complete:false,bytes:0});const group=groups.get(key);group.downloaded++;group.bytes+=bytes;group.complete=group.downloaded===group.total;totalBytes+=bytes;totalFiles++;}));
      return {supported:true,totalFiles,totalBytes,packs:[...groups.values()].sort((a,b)=>a.surahId-b.surahId||a.qariId.localeCompare(b.qariId))};
    }catch{return {supported:false,totalFiles:0,totalBytes:0,packs:[]};}
  }
  async function refreshAudioStatus(){
    if(!root||!s())return;const id=state.surahId,qariId=audioSourceKey();const result=await audioStatus();if(id!==state.surahId||qariId!==audioSourceKey())return;
    const saved=result.packs.find(p=>p.surahId===id&&p.qariId===qariId);const busy=downloading&&downloading.surahId===id&&downloading.qariId===qariId;
    const missing=state.audioMode==='translation'&&!catalogEntries('audioTranslations').some(e=>e.id===state.audioEdition);
    $('reader-audio-status').textContent=missing?t('noSpoken'):busy?`${t('audioDownloading')} · ${downloading.done}/${downloading.total}`:saved?.complete?`${t('audioOffline')} · ${formatBytes(saved.bytes)}`:saved?.downloaded?`${saved.downloaded}/${saved.total} ${t('audioPartial')}`:t(result.supported?'audioOnline':'audioUnsupported');
    $('reader-audio-download').disabled=missing||!result.supported||!!downloading&&!busy;$('reader-audio-download').querySelector('span').textContent=t(busy?'cancelDownload':'download');$('reader-audio-download').hidden=!!saved?.complete&&!busy;
    $('reader-audio-remove').hidden=!saved?.downloaded||!!downloading;$('reader-audio-remove').querySelector('span').textContent=t('removeDownload');
  }
  function formatBytes(bytes){return bytes>=1048576?`${(bytes/1048576).toFixed(1)} MB`:`${Math.round(bytes/1024)} KB`;}
  async function downloadCurrentAudio(){
    if(downloading||!s())return;if(!('caches'in globalThis)){announce(t('audioUnsupported'));return;}
    const surahId=state.surahId,mode=state.audioMode,sourceId=mode==='translation'?state.audioEdition:state.qariId,qariId=audioSourceKey(mode,sourceId),total=s().total_verses,controller=new AbortController();const job={surahId,qariId,total,mode,sourceId,done:0,controller};downloading=job;refreshAudioStatus();
    downloadPromise=(async()=>{
      const cache=await caches.open(AUDIO_CACHE),urls=await sourceURLs(mode,sourceId,surahId,controller.signal);
      const pending=[];for(let ayah=1;ayah<=total;ayah++){const url=urls.get(ayah);if(!vettedAudioURL(url))throw new Error(t('spokenUnavailable'));if(await cache.match(url))job.done++;else pending.push(ayah);}
      if(navigator.storage?.estimate){const estimate=await navigator.storage.estimate();if(pending.length&&estimate.quota&&estimate.quota-(estimate.usage||0)<524288)throw new Error('quota');}
      let next=0;const workers=Array.from({length:Math.min(3,pending.length)},async()=>{while(next<pending.length){if(controller.signal.aborted)throw new DOMException('Aborted','AbortError');const ayah=pending[next++],url=urls.get(ayah);const response=await fetch(url,{mode:'cors',signal:controller.signal});if(!response.ok)throw new Error('audio download failed');const type=response.headers.get('content-type')||'';if(type&&!/audio|octet-stream/i.test(type))throw new Error('unexpected audio response');const blob=await response.blob();if(controller.signal.aborted)throw new DOMException('Aborted','AbortError');if(blob.size===0)throw new Error('empty audio response');await cache.put(url,new Response(blob,{headers:{'Content-Type':'audio/mpeg','Content-Length':String(blob.size)}}));job.done++;if(state.surahId===surahId&&audioSourceKey()===qariId)$('reader-audio-status').textContent=`${t('audioDownloading')} · ${job.done}/${total}`;}});
      try{await Promise.all(workers);}catch(error){controller.abort();await Promise.allSettled(workers);throw error;}return true;
    })();
    try{await downloadPromise;announce(`${globalThis.SURAHS?.[surahId-1]?.transliteration||surahId}: ${t('audioSaved')}`);}
    catch(error){controller.abort();announce(t(error.name==='AbortError'?'audioStopped':'audioDownloadError'));}
    finally{downloading=null;downloadPromise=null;refreshAudioStatus();globalThis.dispatchEvent(new CustomEvent('compass:audio-cache'));}
  }
  async function removeAudio(surahId,qariId){
    const id=Number(surahId);if(!Number.isInteger(id)||id<1||id>114||!('caches'in globalThis))return false;
    if(downloading?.surahId===id&&(!qariId||downloading.qariId===qariId)){downloading.controller.abort();try{await downloadPromise;}catch{}}
    if(state.surahId===id&&(!qariId||audioSourceKey()===qariId))stopAudio();
    try{const cache=await caches.open(AUDIO_CACHE),keys=await cache.keys();await Promise.all(keys.filter(request=>{const details=cachedAudioDetails(request.url);return details?.surahId===id&&(!qariId||details.qariId===qariId);}).map(request=>cache.delete(request)));globalThis.dispatchEvent(new CustomEvent('compass:audio-cache'));refreshAudioStatus();return true;}catch{return false;}
  }
  function normalize(value){return String(value??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ـ/g,'').replace(/\s+/g,' ').trim();}
  function search(query,limit=80){
    const value=normalize(query);if(!value)return [];const count=Math.max(1,Math.min(200,Number(limit)||80));const results=[];const reference=value.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
    for(const chapter of globalThis.SURAHS||[]){
      const installed=pack()[chapter.id],arabic=arabicRecord(chapter.id),records=catalogEntries('translations').map(e=>translationRecord(e.id,chapter.id)).filter(r=>r?.complete&&Array.isArray(r.ayahs));
      const list=Array.isArray(installed)?installed:arabic?.complete&&Array.isArray(arabic.ayahs)?arabic.ayahs.map(row=>({id:row.number,text:row.text})):records[0]?.ayahs.map(row=>({id:row.number,text:''}))||[];
      for(const v of list){const translated=records.map(record=>({text:record.ayahs.find(row=>row.number===v.id)?.text||'',language:record.edition.language,sourceLabel:record.edition.label||record.edition.author}));const match=translated.find(row=>normalize(row.text).includes(value));
        if(reference?chapter.id===Number(reference[1])&&v.id===Number(reference[2]):value.length>=2&&([v.text,v.translation_en,v.translation_ur].some(text=>normalize(text).includes(value))||match)){const selected=match||translated.find(row=>row.language===state.translation)||translated[0];results.push({surahId:chapter.id,ayah:v.id,surahName:chapter.transliteration,name:chapter.name,text:v.text,translation_en:v.translation_en||'',translation_ur:v.translation_ur||'',...(selected?{translation:selected.text,language:selected.language,sourceLabel:selected.sourceLabel}: {})});if(results.length>=count)return results;}
      }
    }
    return results;
  }
  const storagePanels=new Set();
  async function renderStoragePanel(container){
    if(typeof container==='string')container=$(container);if(!container)return;
    storagePanels.add(container);container.classList.add('reader-storage-panel');
    container.innerHTML=`<p class="reader-storage-checking">${t('checking')}</p>`;
    const [result,editions]=await Promise.all([audioStatus(),Promise.resolve().then(()=>content()?.cacheStatus?.()).catch(()=>null)]);
    const complete=(globalThis.SURAHS||[]).length===114&&(globalThis.SURAHS||[]).every(chapter=>Array.isArray(pack()[chapter.id])&&pack()[chapter.id].length===chapter.total_verses);
    const savedEditions=Array.isArray(editions?.items)?editions.items:[];
    const editionShelf=`<div class="reader-storage-audio-heading"><h4>${t('savedEditions')}</h4><span>${savedEditions.length} · ${formatBytes(editions?.bytes||0)}</span></div>${savedEditions.length?`<div class="reader-storage-packs">${savedEditions.map(item=>{const record=item.kind==='arabic'?arabicRecord(item.surahId):content()?.getLoaded?.(item.kind,item.editionId,item.surahId),coverage=item.kind==='tafsir'?`${record?.coverage?.length||0}/${globalThis.SURAHS?.[item.surahId-1]?.total_verses||0} ${t('tafsirCoverage')}`:t(item.complete?'textOffline':'partial');return `<div class="reader-storage-pack"><div><strong>${escape(globalThis.SURAHS?.[item.surahId-1]?.transliteration||String(item.surahId))}</strong><small>${escape(item.label||item.editionId)} · ${escape(languageLabel(item.language))}</small><small>${item.kind==='audioTranslation'?t('audioMetadataOnly'):escape(coverage)}</small></div><span>${formatBytes(item.bytes||0)}</span><button class="text-button" data-storage-edition-remove="${item.surahId}" data-storage-edition="${escape(item.editionId)}" data-storage-kind="${escape(item.kind)}">${icon('close')}${t('remove')}</button></div>`;}).join('')}</div>`:`<p class="reader-storage-empty">${t('noEditions')}</p>`}`;
    container.innerHTML=`<div class="reader-storage-heading"><div><h3>${t('storageTitle')}</h3><p>${t('storageText')}</p></div>${icon('download')}</div><div class="reader-storage-text"><span class="reader-storage-ready ${complete?'is-ready':''}"></span><p>${t(complete?'textReady':'textMissing')}</p>${!complete?`<button class="secondary-button" data-storage-download>${t('downloadPack')}</button>`:''}</div>${editionShelf}<div class="reader-storage-audio-heading"><h4>${t('savedAudio')}</h4><span>${result.totalFiles} ${t('ayahs')} · ${formatBytes(result.totalBytes)}</span></div>${!result.supported?`<p class="reader-storage-empty">${t('audioUnsupported')}</p>`:result.packs.length?`<div class="reader-storage-packs">${result.packs.map(item=>`<div class="reader-storage-pack"><div><strong dir="ltr">${escape(globalThis.SURAHS?.[item.surahId-1]?.transliteration||String(item.surahId))}</strong><small dir="ltr">${escape(item.qariLabel)} · ${escape(languageLabel(item.language))}</small></div><span>${item.downloaded}/${item.total} ${t('ayahs')}<small>${formatBytes(item.bytes)} · ${t(item.complete?'audioOffline':'partial')}</small></span><button class="text-button" data-storage-remove="${item.surahId}" data-storage-qari="${escape(item.qariId)}">${icon('close')}${t('remove')}</button></div>`).join('')}</div>`:`<p class="reader-storage-empty">${t('noAudio')}</p>`}`;
    container.querySelector('[data-storage-download]')?.addEventListener('click',async event=>{event.currentTarget.disabled=true;try{await globalThis.CompassApp?.downloadPack?.();}catch{announce(t('audioDownloadError'));}finally{renderStoragePanel(container);}});
    container.querySelectorAll('[data-storage-remove]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;const removed=await removeAudio(Number(button.dataset.storageRemove),button.dataset.storageQari);if(!removed)announce(t('audioRemoveError'));renderStoragePanel(container);}));
    container.querySelectorAll('[data-storage-edition-remove]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;const chapter=Number(button.dataset.storageEditionRemove),id=button.dataset.storageEdition,kind=button.dataset.storageKind;if(kind==='arabic')loadedArabic.delete(chapter);else ({translation:loadedTranslations,tafsir:loadedTafsirs,audioTranslation:loadedSpoken}[kind])?.delete(editionKey(id,chapter));try{const removed=await content()?.removeCached?.(kind,id,chapter);if(!removed)announce(t('editionRemoveError'));}catch{announce(t('editionRemoveError'));}if(root&&chapter===state.surahId&&!$('reader-note-dialog')?.open){renderText();renderTafsirBook();updateSourceState();}renderStoragePanel(container);}));
  }
  function refreshStoragePanels(){for(const container of storagePanels){if(container.isConnected)renderStoragePanel(container);else storagePanels.delete(container);}}
  function getPreferences(){const values={'layout':state.layout,'translation':state.translation,'translation-edition':state.translationEdition,'tafsir-edition':state.tafsirEdition,'audio-mode':state.audioMode,'audio-language':state.audioLanguage,'audio-edition':state.audioEdition,'font-size':state.fontSize,'qari':state.qariId,'follow':!!state.follow,'rate':state.rate};return Object.fromEntries(Object.entries(values).map(([key,value])=>['compass-reader-'+key,JSON.stringify(value)]));}
  function restorePreferenceValues(values,persist=true){
    const set=(key,field,valid)=>{const value=values['compass-reader-'+key];if(!valid(value))return;if(value!==state[field]&&['translation','translationEdition','tafsirEdition'].includes(field))cancelSourceLoads(field==='tafsirEdition'?'tafsir':'reading');if(value!==state[field]&&['qariId','audioMode','audioLanguage','audioEdition'].includes(field))stopAudio();state[field]=value;if(persist)saveSetting(key,value);};
    set('layout','layout',v=>['ayahs','pages'].includes(v));
    set('translation','translation',v=>['en','ur','ar',...catalogEntries('translations').map(e=>e.language)].includes(v));
    set('translation-edition','translationEdition',v=>translationEditions(state.translation).some(e=>e.id===v)||state.translation==='ar'&&v==='');
    set('tafsir-edition','tafsirEdition',v=>v==='none'||catalogEntries('tafsirs').some(e=>e.id===v));
    set('qari','qariId',v=>reciters().some(q=>q.id===v));set('audio-mode','audioMode',v=>['recitation','translation'].includes(v));
    set('audio-language','audioLanguage',v=>typeof v==='string'&&v!=='ar'&&['en','ur',...catalogEntries('translations').map(e=>e.language),...catalogEntries('audioTranslations').map(e=>e.language)].includes(v));
    set('audio-edition','audioEdition',v=>v===''||catalogEntries('audioTranslations').some(e=>e.id===v&&e.language===state.audioLanguage));
    set('font-size','fontSize',v=>Number.isFinite(v)&&v>=24&&v<=48);set('follow','follow',v=>typeof v==='boolean');set('rate','rate',v=>[.75,1,1.25,1.5].includes(v));if(audio)audio.playbackRate=state.rate;
  }
  function applyPreferences(preferences){
    if(!preferences||typeof preferences!=='object')return;
    const values={};for(const [key,raw] of Object.entries(preferences)){if(typeof raw!=='string'||!key.startsWith('compass-reader-'))continue;try{values[key]=JSON.parse(raw);}catch{}}
    restorePreferenceValues(values);
    if(root)renderChapter();
  }
  globalThis.CompassReader={open,refresh,stopAudio,search,audioStatus,removeAudio,exitFocus,renderStoragePanel,getPreferences,applyPreferences};
  globalThis.addEventListener('compass:quran-ready',()=>{if(root)refresh();refreshStoragePanels();});
  globalThis.addEventListener('compass:audio-cache',refreshStoragePanels);
  globalThis.addEventListener('compass:catalog',()=>{catalogSnapshot=content()?.getCatalog?.()||globalThis.COMPASS_EDITIONS||{};if(root&&!$('reader-note-dialog')?.open){if(!reciters().some(q=>q.id===state.qariId)){stopAudio();state.qariId='alafasy';}refresh();}});
  globalThis.addEventListener('compass:edition-cache',()=>{if(content()?.getLoaded){loadedArabic.clear();loadedTranslations.clear();loadedTafsirs.clear();loadedSpoken.clear();}if(root&&!$('reader-note-dialog')?.open){renderText();renderTafsirBook();updateSourceState();}refreshStoragePanels();});
  let previousLanguage=language();
  let stateRefreshQueued=false;
  globalThis.addEventListener('compass:state',()=>{if(!root||stateRefreshQueued)return;stateRefreshQueued=true;queueMicrotask(()=>{stateRefreshQueued=false;const next=language();if(next!==previousLanguage){previousLanguage=next;refresh();}else{updateProgress();renderSidebar();}});});
  globalThis.addEventListener('compass:navigation',event=>{if(event.detail?.view!=='reader'){observer?.disconnect();cancelSourceLoads();stopAudio();if(state.focus)exitFocus();}});
  globalThis.addEventListener('beforeunload',()=>{if(audio)audio.pause();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(ensureShell())renderChapter();},{once:true});else if(ensureShell())renderChapter();
})();
