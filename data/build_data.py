"""Build the compact, offline Surah catalogue. Verse text is added from source imports."""
import json
from pathlib import Path

ROWS = '''1|الفاتحة|Al-Fatihah|The Opening|7
2|البقرة|Al-Baqarah|The Cow|286
3|آل عمران|Ali 'Imran|Family of Imran|200
4|النساء|An-Nisa|The Women|176
5|المائدة|Al-Ma'idah|The Table Spread|120
6|الأنعام|Al-An'am|The Cattle|165
7|الأعراف|Al-A'raf|The Heights|206
8|الأنفال|Al-Anfal|The Spoils of War|75
9|التوبة|At-Tawbah|The Repentance|129
10|يونس|Yunus|Jonah|109
11|هود|Hud|Hud|123
12|يوسف|Yusuf|Joseph|111
13|الرعد|Ar-Ra'd|The Thunder|43
14|إبراهيم|Ibrahim|Abraham|52
15|الحجر|Al-Hijr|The Rocky Tract|99
16|النحل|An-Nahl|The Bee|128
17|الإسراء|Al-Isra|The Night Journey|111
18|الكهف|Al-Kahf|The Cave|110
19|مريم|Maryam|Mary|98
20|طه|Taha|Ta-Ha|135
21|الأنبياء|Al-Anbya|The Prophets|112
22|الحج|Al-Hajj|The Pilgrimage|78
23|المؤمنون|Al-Mu'minun|The Believers|118
24|النور|An-Nur|The Light|64
25|الفرقان|Al-Furqan|The Criterion|77
26|الشعراء|Ash-Shu'ara|The Poets|227
27|النمل|An-Naml|The Ant|93
28|القصص|Al-Qasas|The Stories|88
29|العنكبوت|Al-'Ankabut|The Spider|69
30|الروم|Ar-Rum|The Romans|60
31|لقمان|Luqman|Luqman|34
32|السجدة|As-Sajdah|The Prostration|30
33|الأحزاب|Al-Ahzab|The Combined Forces|73
34|سبإ|Saba|Sheba|54
35|فاطر|Fatir|Originator|45
36|يس|Ya-Sin|Ya-Sin|83
37|الصافات|As-Saffat|Those Who Set the Ranks|182
38|ص|Sad|Sad|88
39|الزمر|Az-Zumar|The Groups|75
40|غافر|Ghafir|The Forgiver|85
41|فصلت|Fussilat|Explained in Detail|54
42|الشورى|Ash-Shuraa|The Consultation|53
43|الزخرف|Az-Zukhruf|The Ornaments of Gold|89
44|الدخان|Ad-Dukhan|The Smoke|59
45|الجاثية|Al-Jathiyah|The Crouching|37
46|الأحقاف|Al-Ahqaf|The Wind-Curved Sandhills|35
47|محمد|Muhammad|Muhammad|38
48|الفتح|Al-Fath|The Victory|29
49|الحجرات|Al-Hujurat|The Rooms|18
50|ق|Qaf|Qaf|45
51|الذاريات|Adh-Dhariyat|The Winnowing Winds|60
52|الطور|At-Tur|The Mount|49
53|النجم|An-Najm|The Star|62
54|القمر|Al-Qamar|The Moon|55
55|الرحمن|Ar-Rahman|The Most Merciful|78
56|الواقعة|Al-Waqi'ah|The Inevitable|96
57|الحديد|Al-Hadid|The Iron|29
58|المجادلة|Al-Mujadilah|The Pleading Woman|22
59|الحشر|Al-Hashr|The Exile|24
60|الممتحنة|Al-Mumtahanah|The Woman to Be Examined|13
61|الصف|As-Saf|The Ranks|14
62|الجمعة|Al-Jumu'ah|The Congregation, Friday|11
63|المنافقون|Al-Munafiqun|The Hypocrites|11
64|التغابن|At-Taghabun|The Mutual Disillusion|18
65|الطلاق|At-Talaq|The Divorce|12
66|التحريم|At-Tahrim|The Prohibition|12
67|الملك|Al-Mulk|The Sovereignty|30
68|القلم|Al-Qalam|The Pen|52
69|الحاقة|Al-Haqqah|The Reality|52
70|المعارج|Al-Ma'arij|The Ascending Stairways|44
71|نوح|Nuh|Noah|28
72|الجن|Al-Jinn|The Jinn|28
73|المزمل|Al-Muzzammil|The Enshrouded One|20
74|المدثر|Al-Muddaththir|The Cloaked One|56
75|القيامة|Al-Qiyamah|The Resurrection|40
76|الإنسان|Al-Insan|Man|31
77|المرسلات|Al-Mursalat|The Emissaries|50
78|النبإ|An-Naba|The Tidings|40
79|النازعات|An-Nazi'at|Those Who Drag Forth|46
80|عبس|'Abasa|He Frowned|42
81|التكوير|At-Takwir|The Overthrowing|29
82|الانفطار|Al-Infitar|The Cleaving|19
83|المطففين|Al-Mutaffifin|The Defrauding|36
84|الانشقاق|Al-Inshiqaq|The Sundering|25
85|البروج|Al-Buruj|The Mansions of the Stars|22
86|الطارق|At-Tariq|The Nightcomer|17
87|الأعلى|Al-A'la|The Most High|19
88|الغاشية|Al-Ghashiyah|The Overwhelming|26
89|الفجر|Al-Fajr|The Dawn|30
90|البلد|Al-Balad|The City|20
91|الشمس|Ash-Shams|The Sun|15
92|الليل|Al-Layl|The Night|21
93|الضحى|Ad-Duhaa|The Morning Hours|11
94|الشرح|Ash-Sharh|The Relief|8
95|التين|At-Tin|The Fig|8
96|العلق|Al-'Alaq|The Clot|19
97|القدر|Al-Qadr|The Power|5
98|البينة|Al-Bayyinah|The Clear Proof|8
99|الزلزلة|Az-Zalzalah|The Earthquake|8
100|العاديات|Al-'Adiyat|The Courser|11
101|القارعة|Al-Qari'ah|The Calamity|11
102|التكاثر|At-Takathur|The Rivalry in World Increase|8
103|العصر|Al-'Asr|The Declining Day|3
104|الهمزة|Al-Humazah|The Traducer|9
105|الفيل|Al-Fil|The Elephant|5
106|قريش|Quraysh|Quraysh|4
107|الماعون|Al-Ma'un|Small Kindnesses|7
108|الكوثر|Al-Kawthar|The Abundance|3
109|الكافرون|Al-Kafirun|The Disbelievers|6
110|النصر|An-Nasr|The Divine Support|3
111|المسد|Al-Masad|The Palm Fiber|5
112|الإخلاص|Al-Ikhlas|The Sincerity|4
113|الفلق|Al-Falaq|The Daybreak|5
114|الناس|An-Nas|Mankind|6'''

REVELATION = [96,68,73,74,1,111,81,87,92,89,93,94,103,100,108,102,107,109,105,113,114,112,53,80,97,91,85,95,106,101,75,104,77,50,90,86,54,38,7,72,36,25,35,19,20,56,26,27,28,17,10,11,12,15,6,37,31,34,39,40,41,42,43,44,45,46,51,88,18,16,71,14,21,23,32,52,67,69,70,78,79,82,84,30,29,83,2,8,3,33,60,4,99,57,47,13,55,76,65,98,59,24,22,63,58,49,66,64,61,62,48,5,9,110]
MEDINAN = {2,3,4,5,8,9,13,22,24,33,47,48,49,55,57,58,59,60,61,62,63,64,65,66,76,98,99,110}
JUZ_STARTS = [(1,1),(2,142),(2,253),(3,93),(4,24),(4,148),(5,82),(6,111),(7,88),(8,41),(9,93),(11,6),(12,53),(15,1),(17,1),(18,75),(21,1),(23,1),(25,21),(27,56),(29,46),(33,31),(36,28),(39,32),(41,47),(46,1),(51,31),(58,1),(67,1),(78,1)]

SUMMARIES = '''1|A prayer praising Allah, seeking His help, and asking for guidance along the straight path.|Praise and worship;Divine mercy;Seeking guidance
2|This chapter brings together guidance on faith, worship, family life, and community responsibilities, alongside accounts of earlier peoples and prophets.|Faith and guidance;Prayer and charity;Family and financial ethics;Covenants and accountability
3|This chapter discusses revelation, the family of Imran, and steadfast faith, calling believers to unity, patience, and trust in Allah.|Mary and Jesus;Unity and steadfastness;Revelation and belief;Patience in adversity
4|This chapter addresses justice in family and community life, with guidance on the rights of women, orphans, and vulnerable people.|Orphan protection;Marriage and inheritance;Justice and trust;Sincerity and hypocrisy
5|This chapter emphasizes fulfilling commitments and gives guidance on lawful food, worship, and justice, while recounting exchanges involving Moses and Jesus.|Covenants and commitments;Lawful food;Worship and justice;Jesus and the disciples
6|This chapter presents signs of Allah's oneness and challenges idolatry, linking faith with moral duties and accountability.|Divine oneness;Signs in creation;Prophethood;Ethical responsibilities
7|This chapter recounts Adam and Iblis and the missions of several prophets, contrasting humble acceptance of guidance with arrogance and rejection.|Adam and Iblis;Prophets and their peoples;Humility and arrogance;Judgment and mercy
8|This chapter addresses faith, solidarity, and conduct in times of conflict, emphasizing obedience, trust, and responsible community relationships.|Trust in Allah;Community solidarity;Conduct in conflict;Treaties and responsibility
9|This chapter discusses treaties, conflict, sincere commitment, and repentance, contrasting faithful conduct with hypocrisy.|Treaties and obligations;Repentance;Sincerity and hypocrisy;Charity and commitment
10|This chapter calls people to reflect on revelation and creation, with accounts of Noah, Moses, and the people of Jonah.|Revelation;Signs in creation;Prophetic accounts;Faith and accountability
11|Through accounts of earlier prophets and their peoples, this chapter stresses perseverance, moral responsibility, and the consequences of rejecting guidance.|Prophetic missions;Perseverance;Justice and responsibility;Judgment and mercy
12|This chapter tells the story of Joseph, from his early dream and separation from his family to hardship, responsibility, and reunion.|Joseph's story;Patience and trust;Temptation and integrity;Forgiveness and reunion
13|This chapter describes signs in the natural world, the truth of revelation, and the importance of remembrance and fulfilling commitments.|Signs in nature;Truth and falsehood;Remembrance of Allah;Faithfulness to covenants
14|This chapter contrasts gratitude with ingratitude and includes Abraham's prayers, emphasizing the purpose of prophetic guidance.|Gratitude;Prophetic guidance;Abraham's prayers;Accountability
15|This chapter affirms the revealed reminder and recounts Adam, Iblis, and earlier communities, calling for patient devotion.|Revelation;Adam and Iblis;Earlier communities;Patience and worship
16|This chapter invites reflection on Allah's many gifts, including provision and the bee, and calls for gratitude, justice, and good conduct.|Blessings and gratitude;Signs in creation;Justice and kindness;Faithful commitments
17|This chapter mentions the night journey and sets out guidance on worship, family duties, and personal ethics, alongside reminders of resurrection.|The night journey;Parents and family;Personal ethics;Revelation and resurrection
18|This chapter presents the stories of the people of the cave, the two gardens, Moses and his teacher, and Dhul-Qarnayn as lessons in faith and responsibility.|Trials of faith;Wealth and humility;Knowledge and patience;Power and responsibility
19|This chapter recounts the lives of several prophets, including the accounts of Mary and Jesus, and emphasizes Allah's mercy and the truth of resurrection.|Mary and Jesus;Prophetic accounts;Divine mercy;Resurrection
20|The account of Moses and Pharaoh forms much of this chapter, which also discusses Adam and calls for prayer and remembrance.|Moses and Pharaoh;Revelation and guidance;Prayer and remembrance;Adam and human weakness
21|This chapter recalls many prophets and their shared call to worship Allah, while stressing resurrection and the approach of accountability.|Unity of prophetic teaching;Divine oneness;Resurrection;Mercy and accountability
22|This chapter links reflection on resurrection with guidance on pilgrimage, sacrifice, and sincere worship.|Resurrection;Pilgrimage;Sacrifice and sincerity;Worship and justice
23|This chapter describes the qualities of successful believers, reflects on human creation, and recounts the missions of earlier prophets.|Qualities of believers;Prayer and trust;Human creation;Prophetic guidance
24|This chapter gives guidance on personal and social conduct, including accusations, modesty, privacy, and family life, and includes the passage about divine light.|Modesty and privacy;Accusations and justice;Family and community;Divine light
25|This chapter affirms the Quran as a criterion and describes the humility, restraint, and devotion of the servants of the Most Merciful.|Revelation as guidance;Prophethood;Humility and restraint;Prayer and repentance
26|This chapter recounts the missions of several prophets and their peoples' responses, ending with a discussion of revelation and poets.|Prophetic accounts;Faith and rejection;Revelation;Moral responsibility in speech
27|This chapter includes accounts of Moses, Solomon and the Queen of Sheba, Salih, and Lot, calling attention to divine signs and gratitude.|Solomon and Sheba;Gratitude;Prophetic accounts;Signs and resurrection
28|This chapter recounts Moses' early life and confrontation with Pharaoh, then presents the story of Qarun and the dangers of arrogance in wealth.|Moses' early life;Oppression and deliverance;Wealth and arrogance;Divine guidance
29|This chapter explains that faith is tested and recalls earlier communities, using the spider's house as an image of fragile reliance.|Trials of faith;Perseverance;Prophetic accounts;False sources of security
30|This chapter mentions the Romans and explores signs of Allah in human life and nature, connecting them with resurrection and responsibility.|Signs in creation;Human diversity;Marriage and affection;Resurrection
31|This chapter includes Luqman's advice to his son on faith and conduct, alongside reminders of gratitude and the limits of human knowledge.|Luqman's counsel;Parents and gratitude;Humility;Divine knowledge
32|This chapter discusses revelation, creation, and resurrection, contrasting those who humbly respond to guidance with those who reject it.|Revelation;Creation and resurrection;Prayer and humility;Faith and accountability
33|This chapter addresses community life during adversity and gives guidance concerning the Prophet's household, family relationships, and social conduct.|Community in adversity;Family relationships;The Prophet's household;Sincerity and responsibility
34|This chapter recalls David, Solomon, and the people of Sheba, contrasting gratitude for Allah's gifts with rejection and misuse of prosperity.|David and Solomon;Sheba;Gratitude and prosperity;Resurrection and accountability
35|This chapter presents Allah as the Originator and calls people to recognize His mercy and signs, while taking responsibility for their own deeds.|Divine creation;Mercy;Signs in nature;Personal accountability
36|This chapter affirms revelation and recounts the messengers sent to a city, then points to signs in nature and the certainty of resurrection.|Revelation and messengers;Signs in nature;Resurrection;Accountability
37|This chapter affirms Allah's oneness and includes accounts of several prophets, notably Abraham and the sacrifice, while contrasting the outcomes of belief and rejection.|Divine oneness;Abraham and the sacrifice;Prophetic accounts;Judgment and reward
38|This chapter recounts David, Solomon, Job, and Adam, drawing attention to humility, repentance, and the danger of arrogance.|David and Solomon;Job's patience;Repentance;Adam and Iblis
39|This chapter calls for sincere worship, reflection on creation, and repentance, and vividly describes the gathering for final judgment.|Sincere worship;Mercy and repentance;Signs in creation;Final judgment
40|This chapter emphasizes forgiveness and accountability and includes the words of a believing man from Pharaoh's family who defended Moses.|Forgiveness;Moses and Pharaoh;Faithful counsel;Judgment and prayer
41|This chapter affirms the clarity of revelation and invites reflection on divine signs, while calling for patient and gracious conduct toward others.|Revelation;Signs within and around us;Good conduct;Patience and accountability
42|This chapter discusses revelation and Allah's authority, encouraging consultation, justice, forgiveness, and measured responses to wrongdoing.|Revelation;Consultation;Justice;Forgiveness
43|This chapter challenges the use of wealth and social standing as measures of truth and recalls episodes involving Abraham, Moses, and Jesus.|Faith and material wealth;Rejection of idols;Prophetic accounts;Revelation
44|This chapter refers to the blessed night of revelation and the smoke, recounts Moses and Pharaoh, and contrasts judgment with the reward of the righteous.|Revelation;Warning and judgment;Moses and Pharaoh;Reward of the righteous
45|This chapter points to signs in the heavens and earth and describes communities gathered for judgment with the records of their deeds.|Signs in creation;Revelation;Records of deeds;Final judgment
46|This chapter affirms revelation, calls for kindness to parents, recalls the people of Ad, and describes a group of jinn listening to the Quran.|Revelation;Kindness to parents;Hud and Ad;Jinn hearing the Quran
47|This chapter contrasts belief with rejection and hypocrisy, addressing commitment and conduct in conflict while warning against attachment to worldly life.|Faith and hypocrisy;Commitment;Conduct in conflict;The passing worldly life
48|This chapter speaks of victory, the believers' pledge, and the reassurance and reward given to those who remain faithful.|Victory;The believers' pledge;Faithfulness;Reassurance and reward
49|This chapter teaches respectful community conduct, including verifying reports and avoiding ridicule, suspicion, and backbiting.|Respectful conduct;Verifying information;Reconciliation;Human equality and piety
50|This chapter stresses resurrection and the recording of human deeds, inviting reflection on creation, death, and the return to Allah.|Resurrection;Records of deeds;Death;Signs in creation
51|This chapter describes signs in the earth and human lives and recalls earlier communities, affirming worship and Allah's provision.|Signs in creation;Prophetic accounts;Worship;Divine provision
52|This chapter warns of judgment and describes the reward of the faithful, affirming the truth of revelation and encouraging patience.|Final judgment;Reward of the faithful;Revelation;Patience
53|This chapter affirms the revelation received by the Prophet, rejects claims about idols, and emphasizes responsibility for one's own effort.|Revelation;Rejection of idols;Personal responsibility;Divine power
54|This chapter refers to the splitting of the moon and recounts the fate of earlier communities, repeatedly calling people to heed the Quran's reminder.|Warning signs;Earlier communities;The Quran as reminder;Accountability
55|This chapter addresses humans and jinn through repeated reminders of Allah's favors, describing creation, balance, judgment, and the gardens of reward.|Divine favors;Creation and balance;Humans and jinn;Judgment and paradise
56|This chapter describes the inevitable event of resurrection and the different groups of people, using creation and provision as reminders of Allah's power.|Resurrection;Human outcomes;Creation;Provision and gratitude
57|This chapter calls for faith and generous giving, describes the fleeting nature of worldly life, and speaks of revelation, justice, and iron.|Faith and charity;The passing worldly life;Justice;Light and accountability
58|This chapter responds to a woman's dispute about marriage and gives guidance on private conversations, gathering etiquette, and faithful conduct.|Marriage and justice;Private conversations;Gathering etiquette;Faithfulness
59|This chapter discusses exile and the distribution of communal wealth, praises the emigrants and their helpers, and ends with names and attributes of Allah.|Exile;Wealth distribution;Generosity and solidarity;Names and attributes of Allah
60|This chapter addresses allegiance and relationships, distinguishing hostility from peaceful dealings, and gives guidance concerning believing women and their pledge.|Faithful allegiance;Justice toward others;Believing women;Commitments
61|This chapter calls believers to align their words with their deeds and remain united, recalling Moses and Jesus and encouraging faithful commitment.|Words and deeds;Unity;Moses and Jesus;Faithful commitment
62|This chapter describes the Messenger's teaching and purification of the community and calls believers to the Friday prayer.|Revelation and teaching;Spiritual responsibility;Friday prayer;Worship and livelihood
63|This chapter exposes hypocrisy and warns believers against allowing wealth and children to distract them from remembrance and generous giving.|Hypocrisy;Remembrance;Wealth and family;Giving before death
64|This chapter affirms creation and resurrection and calls for obedience and charity, while warning that wealth and family can be a test.|Resurrection;Faith and obedience;Wealth and family;Charity
65|This chapter gives detailed guidance on divorce, waiting periods, and fair provision, encouraging mindfulness of Allah and trust in Him.|Divorce;Waiting periods;Fair provision;Trust in Allah
66|This chapter addresses matters concerning the Prophet's household, calls for sincere repentance, and gives examples of faithful and unfaithful individuals.|Household responsibility;Sincere repentance;Personal accountability;Examples of faith
67|This chapter affirms Allah's sovereignty and describes life and death as a test, inviting reflection on the order of creation and the return to Him.|Divine sovereignty;Life as a test;Signs in creation;Accountability
68|This chapter affirms the Prophet's character, tells the story of the garden owners, and calls for patience while warning against arrogance and greed.|Character;The garden owners;Greed and generosity;Patience
69|This chapter describes the inevitable reality of judgment, recalls earlier communities, and contrasts people receiving their records in different hands.|Judgment;Earlier communities;Records of deeds;Revelation
70|This chapter describes the coming judgment and human anxiety, contrasting it with the steadiness of those devoted to prayer and ethical responsibility.|Judgment;Human anxiety;Prayer;Charity and responsibility
71|This chapter recounts Noah's persistent calls to his people, urging repentance and reflection on the gifts and signs of Allah.|Noah's mission;Repentance;Persistence;Signs and blessings
72|This chapter reports a group of jinn responding to the Quran and affirms Allah's oneness and His exclusive knowledge of the unseen.|Jinn hearing revelation;Divine oneness;Worship;Knowledge of the unseen
73|This chapter calls for night prayer and measured Quran recitation, emphasizing patient devotion while recognizing differing human circumstances.|Night prayer;Measured recitation;Patience;Worship within one's capacity
74|This chapter calls the Prophet to arise and warn, emphasizes purity and steadfastness, and describes rejection and accountability.|Warning and guidance;Purity;Steadfastness;Accountability
75|This chapter affirms resurrection and moral accountability, describing the human conscience, death, and Allah's power to restore life.|Resurrection;The human conscience;Death;Accountability
76|This chapter reflects on human creation and choice, praising sincere care for the vulnerable and describing the reward of the righteous.|Human choice;Care for the vulnerable;Sincerity;Patience and reward
77|This chapter repeatedly warns of the day of decision, pointing to human creation, the earth, and the fate of earlier peoples.|The day of decision;Creation;Earlier peoples;Accountability
78|This chapter contrasts the great news of resurrection with signs in creation and describes judgment and the outcomes of human deeds.|Resurrection;Signs in creation;Judgment;Reward and punishment
79|This chapter describes resurrection, recalls Moses and Pharaoh, and contrasts arrogant pursuit of worldly life with restraint and mindfulness.|Resurrection;Moses and Pharaoh;Arrogance;Self-restraint
80|This chapter emphasizes giving sincere seekers proper attention, then reflects on revelation, human provision, and the final overwhelming cry.|Attentiveness to guidance;Revelation;Human provision;Final judgment
81|This chapter describes upheaval in the cosmos at the end of worldly life and affirms the truth and trustworthiness of revelation.|Cosmic upheaval;Human accountability;Revelation;The truthful message
82|This chapter describes the heavens breaking apart and reminds people of their Creator, the recording of deeds, and the day of judgment.|Resurrection;The Creator's generosity;Recording of deeds;Judgment
83|This chapter condemns dishonest weights and measures and contrasts the records and outcomes of the wicked and the righteous.|Honest trade;Records of deeds;Accountability;Reward of the righteous
84|This chapter describes the sky splitting and the earth yielding its contents, followed by humanity's meeting with the Lord and receiving records of deeds.|Resurrection;Meeting the Lord;Records of deeds;Faith and accountability
85|This chapter recalls the persecution of believers associated with the trench and affirms Allah's knowledge, power, and the preservation of the Quran.|Persecution of believers;Faith and steadfastness;Divine knowledge;Revelation
86|This chapter points to the night visitor and human origins, affirming Allah's power to restore life and the decisive nature of the Quran.|Signs in the sky;Human origins;Resurrection;The Quran's message
87|This chapter calls people to glorify their Lord, heed the reminder, and pursue purification, prayer, and the lasting life to come.|Glorifying Allah;Guidance and reminder;Purification and prayer;The life to come
88|This chapter describes the overwhelming day and contrasting human outcomes, then invites reflection on familiar signs in nature.|Judgment;Human outcomes;Signs in nature;The reminder
89|This chapter recalls powerful earlier peoples, challenges mistaken views of prosperity and hardship, and condemns neglect of orphans and the poor.|Earlier peoples;Prosperity and hardship;Care for the vulnerable;The soul at peace
90|This chapter reflects on the difficulty of human life and describes the demanding path of freeing the enslaved, feeding the hungry, and encouraging patience and mercy.|Human responsibility;Freedom and compassion;Feeding the hungry;Patience and mercy
91|This chapter draws attention to creation and the human soul, contrasting purification with corruption and recalling the people of Thamud.|Signs in creation;The human soul;Moral purification;Thamud
92|This chapter contrasts giving and mindfulness with miserliness and denial, describing the different paths people pursue.|Giving;Mindfulness of Allah;Miserliness;Moral choices
93|This chapter reassures the Prophet of Allah's care and calls for kindness to orphans and those in need, and grateful acknowledgment of blessings.|Reassurance;Care for orphans;Kindness to those in need;Gratitude
94|This chapter recalls relief from burdens, affirms that ease accompanies hardship, and calls for continued effort and devotion to the Lord.|Relief from burdens;Ease with hardship;Perseverance;Devotion
95|This chapter affirms the honored creation of humanity and connects lasting reward with faith and righteous deeds.|Human dignity;Faith;Righteous deeds;Divine judgment
96|This chapter begins with the command to read in the name of the Creator and discusses learning, human arrogance, and resistance to worship.|Reading and learning;Creation;Arrogance;Prayer and closeness to Allah
97|This chapter describes the revelation of the Quran in the Night of Decree and the descent of the angels, with peace until dawn.|The Night of Decree;Revelation;The angels;Peace
98|This chapter discusses clear evidence and the messenger bringing revelation, emphasizing sincere worship, prayer, and charity.|Clear evidence;Revelation;Sincere worship;Prayer and charity
99|This chapter describes the earth's shaking and testimony, and the disclosure of even the smallest good and evil deeds.|Resurrection;The earth's testimony;Small deeds;Accountability
100|This chapter uses the image of charging horses and then reflects on human ingratitude, attachment to wealth, and the disclosure of what lies within.|Ingratitude;Attachment to wealth;Resurrection;Inner intentions
101|This chapter describes the striking calamity and the weighing of deeds, contrasting heavy and light scales.|The striking calamity;Weighing of deeds;Judgment;Human outcomes
102|This chapter warns against rivalry in accumulating more and reminds people that they will be questioned about their blessings.|Rivalry for more;Mortality;Accountability;Blessings
103|This chapter declares human loss except for those who believe, do good, and encourage one another in truth and patience.|Time;Faith and good deeds;Truth;Patience
104|This chapter condemns slander and mocking speech, along with hoarding wealth, and warns of the consequences of such conduct.|Slander and mockery;Hoarding wealth;False security;Accountability
105|This chapter recalls the defeat of the people associated with the elephant, illustrating the failure of their scheme before Allah's power.|The people of the elephant;The failure of wrongdoing;Divine power
106|This chapter reminds Quraysh of their familiar journeys, provision, and security, calling them to worship the Lord of the House.|Quraysh;Provision and security;Gratitude;Worship
107|This chapter connects denial of judgment with neglect of orphans and the hungry, heedless prayer, and withholding simple acts of kindness.|Care for orphans;Feeding the hungry;Sincere prayer;Everyday kindness
108|This chapter speaks of the abundance granted to the Prophet and calls for prayer and sacrifice to the Lord.|Divine generosity;Prayer;Sacrifice;Devotion
109|This chapter clearly distinguishes the Prophet's worship from that of the disbelievers and rejects compromise in religious devotion.|Sincere worship;Religious conviction;Faithfulness
110|This chapter describes Allah's help and victory and people entering the religion in groups, calling for praise and seeking forgiveness.|Divine help;Victory;Praise;Seeking forgiveness
111|This chapter condemns Abu Lahab and his wife, declaring that wealth and worldly gain cannot save them from the consequences of their deeds.|Hostility to the message;Wealth and deeds;Accountability
112|This chapter declares Allah's absolute oneness, self-sufficiency, and uniqueness, without parentage, offspring, or equal.|Divine oneness;Self-sufficiency;Uniqueness
113|This chapter is a prayer seeking the Lord of daybreak's protection from harm, darkness, malicious acts, and envy.|Seeking refuge;Protection from harm;Envy;Trust in Allah
114|This chapter is a prayer seeking refuge in the Lord, King, and God of humankind from harmful whispers among jinn and people.|Seeking refuge;Divine lordship;Harmful whispers;Humans and jinn'''

def juz_for(surah, ayah):
    return sum(start <= (surah, ayah) for start in JUZ_STARTS)

def build():
    assert len(REVELATION) == len(set(REVELATION)) == 114
    summaries={}
    for row in SUMMARIES.splitlines():
        id,overview,themes=row.split('|')
        summaries[int(id)]={'overview':overview,'themes':themes.split(';')}
    assert len(summaries)==114
    chapters=[]
    for row in ROWS.splitlines():
        id,name,transliteration,translation,total=row.split('|')
        id,total=int(id),int(total)
        chapters.append(dict(id=id,name=name,transliteration=transliteration,translation=translation,type='medinan' if id in MEDINAN else 'meccan',total_verses=total,revelation_order=REVELATION.index(id)+1,juz=[juz_for(id,1),juz_for(id,total)],**summaries[id]))
    assert len(chapters)==114
    assert sum(s['total_verses'] for s in chapters)==6236
    root=Path(__file__).parent
    (root/'surahs.json').write_text(json.dumps(chapters,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (root/'surahs.js').write_text('/* Offline Surah catalogue. See data/SOURCES.md for provenance. */\nglobalThis.SURAHS = '+json.dumps(chapters,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print('Built 114 Surahs; 6236 ayahs; all 30 juz represented.')

if __name__ == '__main__':
    build()
