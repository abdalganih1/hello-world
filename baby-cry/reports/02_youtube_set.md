# 02 — Real-world test set (YouTube)

## Status: ❌ could not be built from the work environment, so it moved to phone testing

- Searching YouTube works (`yt-dlp ytsearch`), but **downloading any video is refused** from the cloud servers (`HTTP 429` then `Sign in to confirm you're not a bot`, and `403` on the alternative clients). That is YouTube's bot protection for data-centre IPs. I did not try to get around it (no cookies, no proxies), out of respect for the platform's terms.
- So the plan's "decisive test" is still **not done**, and **no external test number appears anywhere in the reports**.

## The alternative (already built): testing from your phones

The web app (`webapp/`, deployed on Cloudflare) has a **🧪 Test log** section:
1. Download the cry clip from YouTube on your phone or computer (for private research testing only).
2. In the app: choose the "true reason according to the source" (what the doctor said in the video) and paste the link.
3. Upload the file. The app analyses it **on the phone itself**, records whether it was right, and shows the running accuracy. "⬇️ Export CSV" then lets you send the results back so they go into the report.

This gives us exactly the evaluation protocol of section 5.2 of the plan, but run by a human who can confirm the label by listening.

## Candidate videos (need human review)

`data/youtube_test/manifest.csv` has 13 candidate videos from the search, with the channel and the credentials **as the channel itself claims them**. The time fields (start/end) and the label are **blank**: they can only be filled in by watching. Notes:
- Most "types of crying" videos have **narration over the cry** or reuse stock clips, so check that every clip is a real cry with no voice over it.
- Sources that rely on **Dunstan Baby Language** are marked `low`. The method is contested and has no strong scientific evidence.
- Prefer videos where the specialist says "this is a hunger cry" about **that specific clip**, not general talk.

See `02_youtube_set_for_review.md` for the review form.
