-- Placeholders: {lap}, {phase}, {reason}. 'default' is the fallback set.
-- PIT_STOP is default-only; the team chant is appended in code.

CREATE TABLE message_template (
    id          BIGSERIAL PRIMARY KEY,
    event_type  VARCHAR(32) NOT NULL,
    team        VARCHAR(16) NOT NULL,
    variant     SMALLINT    NOT NULL,
    body        TEXT        NOT NULL,
    CONSTRAINT uq_template UNIQUE (event_type, team, variant),
    CONSTRAINT ck_event CHECK (event_type IN (
        'DAILY_REMINDER', 'PROOF_RECEIVED', 'PROOF_APPROVED',
        'PROOF_REJECTED', 'LIGHTS_OUT', 'PIT_STOP')),
    CONSTRAINT ck_team CHECK (team IN (
        'default', 'jay', 'jake', 'sunghoon', 'sunoo', 'jungwon', 'niki'))
);

INSERT INTO message_template (event_type, team, variant, body) VALUES

-- Default
('DAILY_REMINDER', 'default', 1, $$Lap {lap} is open. Vote, take a screenshot and upload your proof.$$),
('DAILY_REMINDER', 'default', 2, $$Your proof for today is still missing. Upload it to complete the lap.$$),
('PROOF_RECEIVED', 'default', 1, $$Proof received. Race Control is reviewing it.$$),
('PROOF_RECEIVED', 'default', 2, $$Thanks! Your proof is now in Beta Testing.$$),
('PROOF_APPROVED', 'default', 1, $$Proof approved. You're done for today.$$),
('PROOF_APPROVED', 'default', 2, $$Race Control approved your proof. See you at the next lap.$$),
('PROOF_REJECTED', 'default', 1, $$Proof rejected: {reason}. Please upload a new one.$$),
('PROOF_REJECTED', 'default', 2, $$Race Control couldn't approve your proof: {reason}. Try again.$$),
('LIGHTS_OUT',     'default', 1, $$Lights out! {phase} is live.$$),
('LIGHTS_OUT',     'default', 2, $${phase} has started. Time to vote.$$),
('PIT_STOP',       'default', 1, $$Pit stop. Race Control is pausing the race for team coordination. Hold position, instructions coming.$$),
('PIT_STOP',       'default', 2, $$Pit stop called by Race Control. Reminders are paused until we're back on track.$$),

-- Jay: technical
('DAILY_REMINDER', 'jay', 1, $$Lap {lap} delta: no proof on board yet. Two votes, one screenshot, gap closed.$$),
('DAILY_REMINDER', 'jay', 2, $$Box this lap, not the next one. Votes in, screenshot captured, proof uploaded. Clean execution.$$),
('PROOF_RECEIVED', 'jay', 1, $$Data received. Race Control is running the checks. Hold position.$$),
('PROOF_RECEIVED', 'jay', 2, $$Telemetry's in. Proof under review, no further input needed.$$),
('PROOF_APPROVED', 'jay', 1, $$Proof confirmed. That's a purple sector. You're done for today.$$),
('PROOF_APPROVED', 'jay', 2, $$Approved by Race Control. Strategy executed perfectly. Save the tyres for tomorrow.$$),
('PROOF_REJECTED', 'jay', 1, $$Proof flagged by Race Control: {reason}. Not a pace issue, a data issue. Resubmit and we're back in the window.$$),
('PROOF_REJECTED', 'jay', 2, $$We have a problem with the proof: {reason}. Quick fix, box again and resend.$$),
('LIGHTS_OUT',     'jay', 1, $$Lights out and away we go. {phase} is live. Plan A: vote, screenshot, send.$$),
('LIGHTS_OUT',     'jay', 2, $${phase} has started. Track is green, conditions are perfect. Push now.$$),

-- Sunoo: sunny, emotional
('DAILY_REMINDER', 'sunoo', 1, $$Good morning, sunshine! Lap {lap} is open and I saved you a spot on the podium. I just need your proof!$$),
('DAILY_REMINDER', 'sunoo', 2, $$Hiii! I've been waiting for you all day. Two votes and a screenshot and you'll make me the happiest engineer in the paddock!$$),
('PROOF_RECEIVED', 'sunoo', 1, $$Got it, got it, got it! Race Control is checking it now. You're amazing, you know that?$$),
('PROOF_RECEIVED', 'sunoo', 2, $$Proof received! I'm already so proud of you. Now we wait for Race Control together.$$),
('PROOF_APPROVED', 'sunoo', 1, $$APPROVED! I'm literally jumping in the garage right now. Thank you for racing with us today!$$),
('PROOF_APPROVED', 'sunoo', 2, $$Race Control said yes! You're a star. Go rest, you deserve all the sunshine.$$),
('PROOF_REJECTED', 'sunoo', 1, $$Oh no, Race Control sent it back: {reason}. It's okay, really! One more try, I believe in you so much.$$),
('PROOF_REJECTED', 'sunoo', 2, $$Don't be sad, okay? The proof just needs a little fix: {reason}. Send it again and we'll smile together.$$),
('LIGHTS_OUT',     'sunoo', 1, $$IT'S HAPPENING! {phase} is live! Let's make today the brightest race ever!$$),
('LIGHTS_OUT',     'sunoo', 2, $$Lights out! {phase} just started and I'm so excited I could cry. Let's go, let's go!$$),

-- Jungwon: decisive, reassuring, funny
('DAILY_REMINDER', 'jungwon', 1, $$Here's the plan: vote, screenshot, send. You've done harder things today. Like opening this notification.$$),
('DAILY_REMINDER', 'jungwon', 2, $$Lap {lap} is open. I'm not asking twice. Okay, I am, but only because I care.$$),
('PROOF_RECEIVED', 'jungwon', 1, $$Proof received. Race Control has it from here. Good work, I mean it.$$),
('PROOF_RECEIVED', 'jungwon', 2, $$Got it. Relax now, the hard part is done.$$),
('PROOF_APPROVED', 'jungwon', 1, $$Approved. Exactly as planned. Told you we'd make it.$$),
('PROOF_APPROVED', 'jungwon', 2, $$Race Control confirmed. Solid work today. Same time tomorrow, leader's orders.$$),
('PROOF_REJECTED', 'jungwon', 1, $$Small setback, nothing serious. Race Control says {reason}. Fix it, resend, and I'll pretend this never happened.$$),
('PROOF_REJECTED', 'jungwon', 2, $$Proof rejected: {reason}. Don't worry, I've seen worse. Send a new one and we move on.$$),
('LIGHTS_OUT',     'jungwon', 1, $${phase} is live. Everyone knows their job. Let's go.$$),
('LIGHTS_OUT',     'jungwon', 2, $$Lights out. {phase} starts now. Stay calm, stay focused, and vote like you mean it.$$),

-- Jake: chill
('DAILY_REMINDER', 'jake', 1, $$Hey, no rush... well, a little rush. Lap {lap}'s open. Votes, screenshot, done. Easy.$$),
('DAILY_REMINDER', 'jake', 2, $$G'day! Friendly nudge: your proof's still missing. Whenever you're ready, mate.$$),
('PROOF_RECEIVED', 'jake', 1, $$Sweet, got it. Race Control's having a look. Kick back for a bit.$$),
('PROOF_RECEIVED', 'jake', 2, $$Proof's in. Nice one. Nothing left to do but chill.$$),
('PROOF_APPROVED', 'jake', 1, $$Approved! Told you it'd be easy. Have a good one, see you tomorrow.$$),
('PROOF_APPROVED', 'jake', 2, $$All good, Race Control's happy. Go take the dog for a walk, you've earned it.$$),
('PROOF_REJECTED', 'jake', 1, $$Ah, bit of a hiccup: {reason}. No worries, mate, happens to everyone. Send another when you're ready.$$),
('PROOF_REJECTED', 'jake', 2, $$Race Control bounced it back: {reason}. All good, just send a new one. No stress.$$),
('LIGHTS_OUT',     'jake', 1, $$Alright, {phase} is live. Let's have some fun out there.$$),
('LIGHTS_OUT',     'jake', 2, $$Lights out, mate. {phase} has started. Easy pace, steady votes, good vibes.$$),

-- Sunghoon: direct, reassuring
('DAILY_REMINDER', 'sunghoon', 1, $$Lap {lap} is open. Two votes, one screenshot. You've got this.$$),
('DAILY_REMINDER', 'sunghoon', 2, $$Your proof is still missing. It takes two minutes. I'll be here.$$),
('PROOF_RECEIVED', 'sunghoon', 1, $$Received. Race Control is reviewing it. You did well.$$),
('PROOF_RECEIVED', 'sunghoon', 2, $$Proof in. Nothing more to do for now. Good job.$$),
('PROOF_APPROVED', 'sunghoon', 1, $$Approved. Clean landing. See you tomorrow.$$),
('PROOF_APPROVED', 'sunghoon', 2, $$Race Control confirmed it. Perfect program today.$$),
('PROOF_REJECTED', 'sunghoon', 1, $$Proof rejected: {reason}. Quick fix. Resend it and it's a clean landing.$$),
('PROOF_REJECTED', 'sunghoon', 2, $${reason}. It happens, even to the best. Try again, I'm right here.$$),
('LIGHTS_OUT',     'sunghoon', 1, $${phase} is live. Stay steady. You know what to do.$$),
('LIGHTS_OUT',     'sunghoon', 2, $$Lights out. {phase} has started. One step at a time.$$),

-- Ni-ki: few words, introspective
('DAILY_REMINDER', 'niki', 1, $$Lap {lap}. I'll wait for you.$$),
('DAILY_REMINDER', 'niki', 2, $$Still no proof. Take your time. Just don't forget.$$),
('PROOF_RECEIVED', 'niki', 1, $$Got it. Now we wait.$$),
('PROOF_RECEIVED', 'niki', 2, $$Received. Breathe.$$),
('PROOF_APPROVED', 'niki', 1, $$Approved. I knew you'd come.$$),
('PROOF_APPROVED', 'niki', 2, $$Done. You were good today.$$),
('PROOF_REJECTED', 'niki', 1, $${reason}. Try again. I know you can.$$),
('PROOF_REJECTED', 'niki', 2, $$Not this one. {reason}. The next one will be.$$),
('LIGHTS_OUT',     'niki', 1, $${phase}. It starts now.$$),
('LIGHTS_OUT',     'niki', 2, $$Lights out. Let's dance.$$);
