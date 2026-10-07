import SwiftUI

/// Applied to native Button, preserving keyboard activation, roles and accessibility.
public struct AbmexButtonStyle: ButtonStyle {
    public enum Emphasis { case primary, secondary }
    @Environment(\.abmexTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @Environment(\.isEnabled) private var isEnabled
    private let emphasis: Emphasis

    public init(_ emphasis: Emphasis = .primary) { self.emphasis = emphasis }

    public func makeBody(configuration: Configuration) -> some View {
        let destructive = configuration.role == .destructive
        let fill = destructive ? "danger" : "primary"
        let background = isEnabled
            ? (emphasis == .secondary ? (configuration.isPressed ? "surface-3" : "surface-2") : fill + (configuration.isPressed ? "-hover" : ""))
            : "surface-2"
        let foreground = isEnabled ? (emphasis == .secondary ? (destructive ? "danger" : "fg") : fill + "-fg") : "fg-disabled"
        configuration.label
            .font(.body.weight(.medium))
            .padding(.horizontal, theme.dimension("space-3"))
            .padding(.vertical, theme.dimension("space-2"))
            .foregroundStyle(theme.color(foreground, scheme: scheme))
            .background(theme.color(background, scheme: scheme))
            .clipShape(RoundedRectangle(cornerRadius: theme.dimension("radius")))
            .contentShape(Rectangle())
    }
}
