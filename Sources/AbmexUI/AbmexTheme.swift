import SwiftUI
import AbmexTokens

/// Semantic token overrides scoped to a SwiftUI subtree. Omitted values use the catalog.
public struct AbmexTheme {
    public var colors: [String: [String: Color]]
    public var dimensions: [String: Double]
    public var durations: [String: Double]

    public init(
        colors: [String: [String: Color]] = [:],
        dimensions: [String: Double] = [:],
        durations: [String: Double] = [:]
    ) {
        self.colors = colors
        self.dimensions = dimensions
        self.durations = durations
    }

    public func color(_ role: String, scheme: ColorScheme) -> Color {
        let mode = scheme == .dark ? "dark" : "light"
        if let override = colors[mode]?[role] { return override }
        guard let value = AbmexTokens.colors[mode]?[role] else {
            preconditionFailure("Missing ABMEX color token: \(mode).\(role)")
        }
        return Color(.sRGB, red: value.red, green: value.green, blue: value.blue, opacity: value.alpha)
    }

    public func dimension(_ name: String) -> CGFloat {
        guard let value = dimensions[name] ?? AbmexTokens.dimensions[name], value.isFinite, value >= 0 else {
            preconditionFailure("Missing or invalid ABMEX dimension: \(name)")
        }
        return CGFloat(value)
    }

    /// Reduced motion disables decorative transitions without changing state updates.
    public func animation(_ name: String, reduceMotion: Bool) -> Animation? {
        guard !reduceMotion else { return nil }
        guard let duration = durations[name] ?? AbmexTokens.durations[name], duration.isFinite, duration >= 0 else {
            preconditionFailure("Missing or invalid ABMEX duration: \(name)")
        }
        return .easeInOut(duration: duration)
    }
}

private struct AbmexThemeKey: EnvironmentKey {
    static let defaultValue = AbmexTheme()
}

public extension EnvironmentValues {
    var abmexTheme: AbmexTheme {
        get { self[AbmexThemeKey.self] }
        set { self[AbmexThemeKey.self] = newValue }
    }
}

public extension View {
    func abmexTheme(_ theme: AbmexTheme) -> some View {
        environment(\.abmexTheme, theme)
    }
}
