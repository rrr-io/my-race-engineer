-- Where each device is (reminders go out at sensible local hours) and when it was last reminded.
ALTER TABLE push_subscription
    ADD COLUMN timezone         VARCHAR(64),
    ADD COLUMN last_reminder_at TIMESTAMPTZ,
    ADD COLUMN reminder_day     DATE,
    ADD COLUMN reminder_count   INTEGER NOT NULL DEFAULT 0;

-- Race Control's reminder schedule: one row, edited from /admin. Times are the fan's local time.
CREATE TABLE reminder_settings (
    id             INTEGER NOT NULL PRIMARY KEY,
    enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    interval_hours INTEGER NOT NULL DEFAULT 4,
    window_start   TIME    NOT NULL DEFAULT '10:00',
    window_end     TIME    NOT NULL DEFAULT '22:00',
    CONSTRAINT ck_reminder_single_row CHECK (id = 1),
    CONSTRAINT ck_reminder_interval CHECK (interval_hours BETWEEN 1 AND 24),
    CONSTRAINT ck_reminder_window CHECK (window_start <> window_end)
);

INSERT INTO reminder_settings (id) VALUES (1);

-- Reminder lines for the new flow. {lap} = which reminder of the Korean day this is, {categories} = what is still to do.
UPDATE message_template SET body = $$Lap {lap} is open. Still to vote on MNET+: {categories}. Send a screenshot for each.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'default' AND variant = 1;
UPDATE message_template SET body = $$Your proof is still missing for {categories}. Vote on MNET+ and upload it to complete the lap.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'default' AND variant = 2;
UPDATE message_template SET body = $$Lap {lap} delta: no proof on board for {categories}. Vote on MNET+, send the screenshots, gap closed.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jay' AND variant = 1;
UPDATE message_template SET body = $$Box this lap, not the next one. Missing proofs: {categories}. Votes in, screenshots captured, clean execution.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jay' AND variant = 2;
UPDATE message_template SET body = $$Lap {lap}! I'm still waiting for your proof in {categories} and I saved you a spot on the podium!$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'sunoo' AND variant = 1;
UPDATE message_template SET body = $$Hiii! It's me again. {categories} still needs your vote on MNET+. You'll make me the happiest engineer in the paddock!$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'sunoo' AND variant = 2;
UPDATE message_template SET body = $$Lap {lap}. Still open: {categories}. Here's the plan: vote, screenshot, send. You've done harder things today. Like opening this notification.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jungwon' AND variant = 1;
UPDATE message_template SET body = $$I'm not asking twice. Okay, I am, but only because I care. {categories}, MNET+, screenshots. Go.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jungwon' AND variant = 2;
UPDATE message_template SET body = $$Hey, no rush... well, a little rush. Lap {lap}'s open and {categories} is still waiting. Votes, screenshots, done. Easy.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jake' AND variant = 1;
UPDATE message_template SET body = $$G'day! Friendly nudge: nothing sent yet for {categories}. Whenever you're ready, mate.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'jake' AND variant = 2;
UPDATE message_template SET body = $$Lap {lap} is open. Still missing: {categories}. One screenshot each. You've got this.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'sunghoon' AND variant = 1;
UPDATE message_template SET body = $$Your proof for {categories} is still missing. It takes two minutes. I'll be here.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'sunghoon' AND variant = 2;
UPDATE message_template SET body = $$Lap {lap}. {categories}. I'll wait for you.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'niki' AND variant = 1;
UPDATE message_template SET body = $$Still nothing for {categories}. Take your time. Just don't forget.$$ WHERE event_type = 'DAILY_REMINDER' AND team = 'niki' AND variant = 2;
