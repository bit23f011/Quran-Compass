"""Build editorial reading prompts and external references, never Quran/tafsir text."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
chapters = json.loads((ROOT / 'surahs.json').read_text(encoding='utf-8'))
study = {}
for chapter in chapters:
    chapter_id = chapter['id']
    themes = chapter.get('themes', [])
    study[str(chapter_id)] = {
        'id': chapter_id,
        'introduction': chapter['overview'],
        'readingGuide': [
            'Read the chapter in Arabic, then review a translation of its meanings.',
            'Notice how the passages connect to the chapter’s main topics.',
            'Use a trusted commentary for context before drawing a detailed interpretation.',
            'Save an ayah or write a personal note that you want to revisit.'
        ],
        'reflectionPrompts': [f'What does this chapter teach about {theme.lower()}?' for theme in themes],
        'references': [
            {'label': 'Quran.com — chapter and translations', 'url': f'https://quran.com/{chapter_id}', 'kind': 'quran', 'onlineRequired': True},
            {'label': 'Tafsir Ibn Kathir — English commentary', 'url': f'https://quran.com/{chapter_id}/tafsirs/en-tafisr-ibn-kathir', 'kind': 'tafsir', 'onlineRequired': True}
        ],
        'note': 'These prompts are editorial study aids. The linked commentary supplies interpretation and context; prompts are not Quranic text, tafsir, or a claim about a special virtue.'
    }

assert len(study) == 114
assert all(len(s['reflectionPrompts']) >= 3 and len(s['references']) == 2 for s in study.values())
(ROOT / 'study.js').write_text('/* Editorial reading aids and external study references. See SOURCES.md. */\nglobalThis.STUDY = ' + json.dumps(study, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f'Built study guides for {len(study)} chapters; no Quran/tafsir text generated.')
