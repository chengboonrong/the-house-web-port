# Breakthrough: original The House 1 room SWFs and native ports

Research date: 2026-10-20. This resolves a major **source discovery** blocker, not rights or runtime compatibility.

## Korean Waflash archive: actual room file attachments

A November 12, 2020 Korean archive lists *The House 1* by SINTHAI Studio as five separate room pages, and provides links to SWF attachments. This is **first-game**, unlike previous reports about The House 2.

- Dining room (1/5): https://vidkidz.tistory.com/541 — `Diningroom.swf` (site displays 0.42 MB)
- Bathroom (2/5): https://vidkidz.tistory.com/543 — `Bathroom.swf` (site displays 0.64 MB)
- Kitchen (3/5): https://vidkidz.tistory.com/544 — `Kitchen.swf` (site displays 0.44 MB)
- Living room (4/5): https://vidkidz.tistory.com/545 — `Livingroom.swf` (site displays 0.83 MB)
- Corridor (5/5): https://vidkidz.tistory.com/546 — consult attachment link for exact SWF basename (not confirmed here).

The dining-room page exposes an actual clickable `Diningroom.swf` attachment on `blog.kakaocdn.net`. **We have not yet fetched the bytes or verified their hash/signature**. File names and rounded sizes are the archive's claims; they are not provenance to the 2005 original release without further verification.

Caveat: Some pages also link a `Dining room.swf` variant. Do not assume duplicate names contain identical bytes. Compare SHA-256 and SWF internal metadata after lawful acquisition.

### New implication

There may be five independent playable room SWFs, not just one single entry file. Our host must support preservation of their original paths without inventing transitions. Only inspect each room's internal `loadMovie` or external dependencies to determine whether other wrappers are necessary.

## Another existing port: Android → PS Vita

- Original Android port by MattDev2606: https://gamejolt.com/games/666679/547026
- Vita port source: https://github.com/WolffsRoom/TheHouse2Vita
- Release announcement: https://www.reddit.com/r/VitaPiracy/comments/1vym5nq/release_the_house_1_and_2_to_ps_vita_wolff/

The Vita project supports both 2005 and 2010 titles and operates by loading the Android port's `libcocos2dcpp.so`, via ARM/VitaGL/FalsoJNI. It **does not** convert original Flash bytecode for Safari. Its README says no APK, native library, or proprietary assets are in the repository. It specifies an Android APK SHA-256 as provenance for the supported build; that **does not** identify any original 2005 SWF.

### Technical choice remains

**Primary:** authenticated original room SWFs → Ruffle WebAssembly → Safari.

**Secondary evidence:** Cocos2d-x Android and Vita ports can help compare touch and timing but they are not directly executable in iPhone Safari and may have altered interactions.

**Fallback only:** original ActionScript analysis and targeted TypeScript migration if Ruffle has proven compatibility gaps.

## Verification gates

- [ ] Retrieve legitimate copies of individual first-game SWFs and record SHA-256
- [ ] Confirm `FWS/CWS/ZWS`, ActionScript version, stage resolution, frame rate
- [ ] Check all five room names and any loader/title SWFs
- [ ] Establish inter-room loading paths and media dependencies
- [ ] Check Ruffle behavior for each original room
- [ ] Obtain rights for any public distribution
- [ ] Verify iPhone Safari later

No original copyrighted game files have been uploaded to this repository.
