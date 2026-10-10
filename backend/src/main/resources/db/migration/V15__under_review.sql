-- "Beta Testing" was the wrong name for proof validation: a proof waiting for Race Control is "under review".
-- Only touches the words, so a template Race Control has reworded keeps the rest of its text.
UPDATE message_template SET body = replace(replace(body, 'in Beta Testing', 'under review'), 'Beta Testing', 'review')
WHERE body LIKE '%Beta Testing%';
