/* Configured public-source editions. "configured" is not a live availability claim.
 * Runtime source discovery/validation changes a supported entry to "verified".
 * Content attribution and availability notes: data/SOURCES.md.
 */
(() => {
  const terms='Consult the original publisher/content terms. No independent license audit is implied.';
  const reciters=[
    ['alafasy','Mishary Rashid Alafasy','Alafasy_128kbps'],
    ['husary','Mahmoud Khalil Al-Husary','Husary_128kbps'],
    ['minshawi','Mohamed Siddiq Al-Minshawi','Minshawy_Murattal_128kbps'],
    ['abdulbasit','Abdul Basit Abdus Samad · Murattal','Abdul_Basit_Murattal_192kbps'],
    ['abdulbasit-mujawwad','Abdul Basit Abdus Samad · Mujawwad','Abdul_Basit_Mujawwad_128kbps'],
    ['sudais','Abdurrahman As-Sudais','Abdurrahmaan_As-Sudais_192kbps'],
    ['shuraym','Saud Ash-Shuraym','Saood_ash-Shuraym_128kbps'],
    ['maher','Maher Al-Muaiqly','MaherAlMuaiqly128kbps'],
    ['ghamdi','Saad Al-Ghamdi','Saad_Al-Ghamdi_128kbps'],
    ['ajamy','Ahmed ibn Ali Al-Ajamy','Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net'],
    ['basfar','Abdullah Basfar','Abdullah_Basfar_192kbps'],
    ['ayyoub','Muhammad Ayyoub','Muhammad_Ayyoub_128kbps'],
    ['jibreel','Muhammad Jibreel','Muhammad_Jibreel_128kbps'],
    ['rifai','Hani Ar-Rifai','Hani_Rifai_192kbps'],
    ['dussary','Yasser Ad-Dussary','Yasser_Ad-Dussary_128kbps'],
    ['abbad','Fares Abbad','Fares_Abbad_64kbps'],
    ['qatami','Nasser Al-Qatami','Nasser_Alqatami_128kbps'],
    ['shaatree','Abu Bakr Ash-Shatri','Abu_Bakr_Ash-Shaatree_128kbps'],
    ['husary-mujawwad','Mahmoud Khalil Al-Husary · Mujawwad','Husary_Mujawwad_128kbps'],
    ['minshawi-mujawwad','Mohamed Siddiq Al-Minshawi · Mujawwad','Minshawy_Mujawwad_192kbps'],
    ['neana','Ahmed Neana','Ahmed_Neana_128kbps'],
    ['qasim','Muhsin Al-Qasim','Muhsin_Al_Qasim_192kbps'],
    ['akhdar','Ibrahim Akhdar','Ibrahim_Akhdar_32kbps'],
    ['juhayni','Abdullah Awwad Al-Juhayni','Abdullaah_3awwaad_Al-Juhaynee_128kbps'],
    ['matroud','Abdullah Al-Matroud','Abdullah_Matroud_128kbps']
  ].map(([id,label,path])=>({id,label,author:label,language:'ar',languageLabel:'Arabic',path,provider:'everyayah',sourceUrl:'https://everyayah.com/',format:'audio',kind:'recitation',status:'configured',licenseNote:terms}));
  const translations=[
    ['en.sahih','Sahih International','en','English'],
    ['en.pickthall','Marmaduke Pickthall','en','English'],
    ['en.yusufali','Abdullah Yusuf Ali','en','English'],
    ['en.shakir','Mohammad Habib Shakir','en','English'],
    ['en.arberry','Arthur John Arberry','en','English'],
    ['en.asad','Muhammad Asad','en','English'],
    ['ur.jalandhry','Fateh Muhammad Jalandhry','ur','Urdu'],
    ['ur.ahmedali','Ahmed Ali','ur','Urdu'],
    ['ur.junagarhi','Muhammad Junagarhi','ur','Urdu'],
    ['bn.bengali','Muhiuddin Khan','bn','Bengali'],
    ['hi.hindi','Suhel Farooq Khan and Saifur Rahman Nadwi','hi','Hindi'],
    ['id.indonesian','Indonesian Ministry of Religious Affairs','id','Indonesian'],
    ['fr.hamidullah','Muhammad Hamidullah','fr','French'],
    ['de.aburida','Abu Rida','de','German'],
    ['tr.diyanet','Diyanet İşleri','tr','Turkish'],
    ['ru.krachkovsky','Ignaty Krachkovsky','ru','Russian'],
    ['fa.ayati','Abdol Mohammad Ayati','fa','Persian'],
    ['ta.tamil','Jan Trust Foundation','ta','Tamil'],
    ['es.cortes','Julio Cortés','es','Spanish'],
    ['pt.elhayek','Samir El-Hayek','pt','Portuguese']
  ].map(([id,label,language,languageLabel])=>({id,label,author:label,language,languageLabel,provider:'alquran',sourceEdition:id,sourceUrl:'https://alquran.cloud/api',format:'text',kind:'translation',status:'configured',licenseNote:terms}));
  const tafsirs=[
    {id:'ar.muyassar',label:'Tafsir Al-Muyassar',author:'Tafsir Al-Muyassar',language:'ar',languageLabel:'Arabic',provider:'alquran',sourceEdition:'ar.muyassar',sourceUrl:'https://alquran.cloud/api'},
    {id:'ar.jalalayn',label:'Tafsir Al-Jalalayn',author:'Jalal ad-Din Al-Mahalli and Jalal ad-Din As-Suyuti',language:'ar',languageLabel:'Arabic',provider:'alquran',sourceEdition:'ar.jalalayn',sourceUrl:'https://alquran.cloud/api'},
    {id:'qurancom.169',label:'Tafsir Ibn Kathir · Abridged',author:'Ibn Kathir',language:'en',languageLabel:'English',provider:'qurancom',resourceId:169,sourceUrl:'https://quran.com/tafsirs/en-tafisr-ibn-kathir'},
    {id:'qurancom.168',label:'Ma’ariful Quran',author:'Mufti Muhammad Shafi',language:'en',languageLabel:'English',provider:'qurancom',resourceId:168,sourceUrl:'https://quran.com/tafsirs/en-tafsir-maarif-ul-quran'}
  ].map(e=>({...e,format:'text',kind:'tafsir',status:'configured',licenseNote:terms}));
  const audioTranslations=[
    {id:'en.walk',label:'Ibrahim Walk · Spoken English',author:'Ibrahim Walk',language:'en',languageLabel:'English'},
    {id:'ur.khan',label:'Shamshad Ali Khan · Spoken Urdu',author:'Shamshad Ali Khan',language:'ur',languageLabel:'Urdu'}
  ].map(e=>({...e,provider:'alquran',sourceEdition:e.id,sourceUrl:'https://alquran.cloud/api',format:'audio',kind:'audioTranslation',status:'configured',licenseNote:terms}));
  globalThis.COMPASS_EDITIONS={version:1,reciters,translations,tafsirs,audioTranslations,sourceStatus:{alquran:'not-checked',qurancom:'not-checked',everyayah:'not-checked'}};
  if(typeof module!=='undefined'&&module.exports)module.exports=globalThis.COMPASS_EDITIONS;
})();
