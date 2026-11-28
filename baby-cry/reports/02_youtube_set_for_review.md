# 02 — Review form for the YouTube set (for Eng. Abdalgani / a specialist)

**Status: unreviewed.** No clip has been cut or labelled yet, because downloading was blocked from the cloud. Steps for whoever does the review:

1. Open each link in `data/youtube_test/manifest.csv`.
2. Note every segment where the specialist **explicitly** states the cry's reason: `start_time,end_time,label` (one of: hungry / belly_pain / tired / discomfort / burping), with the quote in `label_source_quote_or_paraphrase`.
3. `label_confidence`: high = explicit statement about that clip · medium = implied from context · low = Dunstan, or a non-specialist.
4. Mark it if there is a voice or music over the cry.
5. Test each clip in the web app with the matching "true reason" selected, then export the CSV.

| # | Video | Channel | Expected type | Notes |
|---|---|---|---|---|
| yt01 | [5 reasons babies cry](https://www.youtube.com/watch?v=TKU1n_mcn_k) | What To Expect | several | verify the expert on screen |
| yt02 | [Hunger or colic?](https://www.youtube.com/watch?v=ZwrgA_uxjjo) | Babynama | hungry / belly_pain | pediatrician |
| yt03 | [Every type of baby cry](https://www.youtube.com/watch?v=3G5aAQL3R_g) | Emma Hubbard | several | OT, not a physician |
| yt04 | [Pain vs PURPLE crying](https://www.youtube.com/watch?v=TWHOFDQHOUA) | Emma Hubbard | belly_pain | |
| yt05 | [Hungry, gassy or tired?](https://www.youtube.com/watch?v=E2I99Hsjo7k) | CloudMom | several | non-specialist → low |
| yt06 | [Decoding baby cries](https://www.youtube.com/watch?v=LbeKZtXWvQM) | Paediatrics | several | identity not verified |
| yt07 | [Gas? Hunger? Colic](https://www.youtube.com/watch?v=YZaY-XzNyME) | Dr Ziad Bassil | belly_pain | pediatrician |
| yt08 | [Colic: does my baby have it?](https://www.youtube.com/watch?v=aD6SepjcNrw) | Children's Physicians MG | belly_pain | |
| yt09 | [Infant colic](https://www.youtube.com/watch?v=Tu-HT6zmwvI) | Ten Kids Two Docs | belly_pain | |
| yt10 | [Why is your baby gassy?](https://www.youtube.com/watch?v=uHymrFLe-G0) | Dr. Steve Silvestro | burping | may have little crying |
| yt11 | [Gas or reflux?](https://www.youtube.com/watch?v=TuB5rlIkY38) | Intermountain | burping / discomfort | |
| yt12 | [Baby cries…](https://www.youtube.com/watch?v=FR1bzQ1PLWc) | Mama Natural | Dunstan | low |
| yt13 | [Decoding baby cries](https://www.youtube.com/watch?v=aG8LIlpwajs) | Carrerasfam | Dunstan? | low |
