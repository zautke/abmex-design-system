import XCTest
import SwiftUI
import AbmexTokens
@testable import AbmexUI

final class AbmexThemeTests: XCTestCase {
    func testGeneratedEasingAndInvalidOverrideRecovery() {
        XCTAssertEqual(AbmexTokens.easings["tab-enter-ease"], [0.2, 0.8, 0.2, 1])
        let custom = AbmexTheme(easings: ["tab-enter-ease": [0.1, -0.2, 0.7, 1.2]])
        XCTAssertEqual(custom.easing("tab-enter-ease"), [0.1, -0.2, 0.7, 1.2])
        for invalid in [[Double.nan, 0, 1, 1], [-1, 0, 1, 1], [0, 1]] {
            XCTAssertEqual(AbmexTheme(easings: ["tab-enter-ease": invalid]).easing("tab-enter-ease"),
                           AbmexTokens.easings["tab-enter-ease"])
        }
        XCTAssertEqual(AbmexTheme().easing("unknown"), AbmexTokens.easings["ease"])
    }

    func testUnknownTokensUseExplicitFallbacksWithoutTrapping() {
        let theme = AbmexTheme()
        XCTAssertEqual(theme.color("unknown", scheme: .dark, fallback: .clear), .clear)
        XCTAssertEqual(theme.dimension("unknown", fallback: 12), 12)
        XCTAssertEqual(theme.dimension("unknown", fallback: .infinity), 0)
        XCTAssertNil(theme.animation("unknown", reduceMotion: false))
    }

    func testInvalidOverridesRecoverCatalogValues() {
        for invalid in [Double.nan, Double.infinity, -1] {
            let theme = AbmexTheme(dimensions: ["space-2": invalid], durations: ["duration": invalid])
            XCTAssertEqual(theme.dimension("space-2"), AbmexTheme().dimension("space-2"))
            XCTAssertNotNil(theme.animation("duration", reduceMotion: false))
            XCTAssertNil(theme.animation("duration", reduceMotion: true))
        }
    }

    func testDefaultThemeResolvesBothCatalogModes() throws {
        let theme = AbmexTheme()
        for (mode, scheme) in [("light", ColorScheme.light), ("dark", ColorScheme.dark)] {
            let token = try XCTUnwrap(AbmexTokens.colors[mode]?["surface"])
            XCTAssertEqual(theme.color("surface", scheme: scheme),
                           Color(.sRGB, red: token.red, green: token.green, blue: token.blue, opacity: token.alpha))
        }
    }

    func testOverridesAreScopedAndMissingOverridesUseCatalog() throws {
        let custom = AbmexTheme(colors: ["dark": ["surface": .clear]], dimensions: ["space-2": 17])
        XCTAssertEqual(custom.color("surface", scheme: .dark), .clear)
        XCTAssertEqual(custom.color("surface", scheme: .light), AbmexTheme().color("surface", scheme: .light))
        XCTAssertEqual(custom.dimension("space-2"), 17)
        XCTAssertEqual(AbmexTheme().dimension("space-2"), CGFloat(try XCTUnwrap(AbmexTokens.dimensions["space-2"])))
        var environment = EnvironmentValues()
        environment.abmexTheme = custom
        XCTAssertEqual(environment.abmexTheme.dimension("space-2"), 17)
    }

    func testReducedMotionSuppressesAnimation() {
        let theme = AbmexTheme(durations: ["test-transition": 0.2])
        XCTAssertNil(theme.animation("test-transition", reduceMotion: true))
        XCTAssertNotNil(theme.animation("test-transition", reduceMotion: false))
    }

    func testEveryStatusToneHasCatalogColorsInBothModes() {
        for tone in AbmexTone.allCases {
            XCTAssertFalse(tone.symbol.isEmpty)
            for mode in ["light", "dark"] {
                XCTAssertNotNil(AbmexTokens.colors[mode]?[tone.foregroundRole], "\(mode).\(tone.foregroundRole)")
                XCTAssertNotNil(AbmexTokens.colors[mode]?[tone.backgroundRole], "\(mode).\(tone.backgroundRole)")
            }
        }
    }

    func testRequiredControlTokensExist() {
        for role in ["fg", "fg-disabled", "border", "surface", "surface-2", "surface-3", "primary", "primary-hover", "primary-fg", "danger", "danger-hover", "danger-fg"] {
            for mode in ["light", "dark"] {
                XCTAssertNotNil(AbmexTokens.colors[mode]?[role], "\(mode).\(role)")
            }
        }
        for key in ["space-2", "space-3", "radius"] {
            XCTAssertNotNil(AbmexTokens.dimensions[key], key)
        }
    }
}

#if os(macOS)
import AppKit

final class AbmexCompositionTests: XCTestCase {
    @MainActor
    func testNoticeAndStatusComposeAtAccessibilityTextSize() {
        let view = AbmexSurface {
            VStack {
                AbmexStatus("Listening", tone: .success)
                AbmexNotice(tone: .danger) {
                    Text("Microphone unavailable")
                } actions: {
                    Button("Dismiss", action: {}).buttonStyle(AbmexButtonStyle(.secondary))
                }
                AbmexNotice { Text("Waiting for command") }
                Button("Start", action: {}).buttonStyle(AbmexButtonStyle())
                Button("Delete", role: .destructive, action: {}).buttonStyle(AbmexButtonStyle())
            }
        }
        .environment(\.dynamicTypeSize, .accessibility3)
        .environment(\.colorScheme, .dark)
        let host = NSHostingView(rootView: view)
        let size = host.fittingSize
        XCTAssertGreaterThan(size.width, 0)
        XCTAssertGreaterThan(size.height, 0)
        XCTAssertTrue(size.width.isFinite && size.height.isFinite)
    }
}
#endif
