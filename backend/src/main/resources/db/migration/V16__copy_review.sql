-- Copy review (October 2026): the fan sends a voting certificate saved from MNET Plus, not a screenshot, and the
-- engineer is called ENGENEer. One UPDATE per template that changed, keyed on (event_type, team, variant).

UPDATE message_template SET body = $t$Lap {lap} is open. Still to vote on MNET+: {categories}. Send the certificates for each vote.$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'default' AND variant = 1;
UPDATE message_template SET body = $t$Hey, no rush... well, a little rush. Lap {lap}'s open and {categories} is still waiting. Votes, certificates, done. Easy.$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jake' AND variant = 1;
UPDATE message_template SET body = $t$Lap {lap} delta: no proof on board for {categories}. Vote on MNET+, send the certificates, gap closed.$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jay' AND variant = 1;
UPDATE message_template SET body = $t$Box this lap, not the next one. Missing proofs: {categories}. Votes in, certificates uploaded, clean execution.$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jay' AND variant = 2;
UPDATE message_template SET body = $t$Lap {lap}. Still open: {categories}. Here's the plan: vote, save certificates, send. You've done harder things today~$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jungwon' AND variant = 1;
UPDATE message_template SET body = $t$I'm not asking twice. Okay, I am, but only because I care. {categories}, MNET+, vote and save certificates. Go.$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jungwon' AND variant = 2;
UPDATE message_template SET body = $t$Lap {lap} is open. Still missing: {categories}. Send certificates for each. You've got this.$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'sunghoon' AND variant = 1;
UPDATE message_template SET body = $t$Hiii! It's me again. {categories} still needs your vote on MNET+. You'll make me the happiest ENGENEer in the paddock!$t$ WHERE event_type = 'DAILY_REMINDER' AND team = 'sunoo' AND variant = 2;
UPDATE message_template SET body = $t$Lights out and away we go. {phase} is live. Plan A: vote, save certificates, send.$t$ WHERE event_type = 'LIGHTS_OUT' AND team = 'jay' AND variant = 1;
UPDATE message_template SET body = $t$Lights out. {phase} starts now. Stay calm, stay focused, and... vote!$t$ WHERE event_type = 'LIGHTS_OUT' AND team = 'jungwon' AND variant = 2;
UPDATE message_template SET body = $t$Lights out! {phase} just started and I'm so excited! Chap Chap! Let's go!$t$ WHERE event_type = 'LIGHTS_OUT' AND team = 'sunoo' AND variant = 2;
UPDATE message_template SET body = $t$Race Control said yes! You're a star. Go rest, you deserve it$t$ WHERE event_type = 'PROOF_APPROVED' AND team = 'sunoo' AND variant = 2;
UPDATE message_template SET body = $t$Small setback, nothing serious. Race Control says {reason}. Fix it, resend! All good.$t$ WHERE event_type = 'PROOF_REJECTED' AND team = 'jungwon' AND variant = 1;
UPDATE message_template SET body = $t$Proof rejected: {reason}. Don't worry~. Send a new one and we move on.$t$ WHERE event_type = 'PROOF_REJECTED' AND team = 'jungwon' AND variant = 2;
UPDATE message_template SET body = $t$Not this one. {reason}. Try again. The next one will be alright.$t$ WHERE event_type = 'PROOF_REJECTED' AND team = 'niki' AND variant = 2;
UPDATE message_template SET body = $t$Time to vote. Open MNET+ and vote in {categories}. Then send the certificates for each category.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'default' AND variant = 1;
UPDATE message_template SET body = $t$Hey, whenever you're ready: pop open MNET+ and vote in {categories}. Grab a certificate for each and send them over. Easy as.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'jake' AND variant = 1;
UPDATE message_template SET body = $t$No stress, mate. MNET+, these categories: {categories}. Save the certificates and we're sorted.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'jake' AND variant = 2;
UPDATE message_template SET body = $t$Race plan: open MNET+ and vote these categories: {categories}. Save your certificates, then send them all.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'jay' AND variant = 1;
UPDATE message_template SET body = $t$Strategy for today: MNET+, categories {categories}. Vote in all of them and box the proofs. Clean execution.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'jay' AND variant = 2;
UPDATE message_template SET body = $t$Here's the plan: open MNET+, vote in {categories}, save certificates, and send them in. You've survived harder things :)$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'jungwon' AND variant = 1;
UPDATE message_template SET body = $t$MNET+ time. Categories: {categories}. One certificate per category, no category left behind. Leader's orders.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'jungwon' AND variant = 2;
UPDATE message_template SET body = $t$MNET+. {categories}. Vote and save the certificates. I trust you.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'niki' AND variant = 1;
UPDATE message_template SET body = $t$Open MNET+. Vote in {categories}. One certificate per category. You've got this.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'sunghoon' AND variant = 1;
UPDATE message_template SET body = $t$Today's categories: {categories}. Vote on MNET+, save each certificate, and send them. I'll be right here.$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'sunghoon' AND variant = 2;
UPDATE message_template SET body = $t$Let's go vote on MNET+! Today's categories: {categories}. Send me the certificates for each one and you'll make my whole day!$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'sunoo' AND variant = 1;
UPDATE message_template SET body = $t$Hiii! Open MNET+ and vote in {categories}. I can't wait to see your certificates, one for every category!$t$ WHERE event_type = 'VOTE_BRIEFING' AND team = 'sunoo' AND variant = 2;
