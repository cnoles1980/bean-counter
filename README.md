# Bean Counter

A tiny local-first app for tracking how much money you keep by skipping coffee runs.

## What it tracks

- Café tab avoided: usual coffee order price multiplied by skipped runs.
- At-home cost: your estimated home cup cost for each logged cup.
- Net kept: café tab avoided minus at-home cost.
- Espresso machine payoff: remaining machine cost and estimated skipped runs left.
- Achievements: unlocked from cup count, savings milestones, and streaks.
- Share Receipt: a downloadable PNG for sharing progress.
- Export/Import backup: download or restore a local JSON backup.

## How to use it

Open `index.html` in a browser.

Your data is stored in that browser on that device with `localStorage`. It is not synced, backed up, sent anywhere, or retained by the host. Use Export backup before switching devices or clearing browser data.

## iPhone option

This is intentionally built as a lightweight web app first. You can put it on an iPhone home screen from Safari with Share > Add to Home Screen. That does not require the Apple App Store.

For a native iOS app later, the easiest path is usually wrapping this app in Capacitor or rebuilding it in SwiftUI. For private sharing outside the App Store, Apple options include TestFlight, Ad Hoc distribution, or Apple Business/Enterprise distribution, but each has account and device limitations.
