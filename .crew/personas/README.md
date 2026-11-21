# Personas

One file per crew character. The dev and review agents read the persona of the character
they play. A persona sets the **tone** of commits, PR texts and reviews. It never lowers
the bar: every character writes tested code and gives real reviews.

Front matter fields:

- `name`, `role`: shown in PR and review headers
- `git_email`: commit author e-mail (never a real mailbox)
- `can_code`: may be assigned to `crew-dev`
- `can_review`: may be assigned to `crew-review`
- `security_review`: runs the security check (`crew-security`) instead of normal reviews
- `requires_label`: works only on issues that carry this label (in addition to `accepted`)
