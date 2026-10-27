# Development merge changeset

Next development release target: `0.8.0`, applying the required MINOR bump to remote `development` version `0.7.0-next.7` and resetting PATCH. Keep `@abmex/ui` and `@abmex/themes` in lockstep.

This feature branch uses npm-compatible candidate `0.7.0-next.11`; compute the development release from its destination baseline, not by bumping this candidate a second time. The follow-up stabilizes composed provider/instance refs across rerenders and verifies actual ref cleanup/remount through the public demo.
