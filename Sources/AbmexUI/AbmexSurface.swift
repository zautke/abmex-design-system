import SwiftUI

/// A content container with semantic fill, border and spacing; it owns no app state.
public struct AbmexSurface<Content: View>: View {
    @Environment(\.abmexTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    private let role: String
    private let padding: String
    private let content: Content

    public init(role: String = "surface", padding: String = "space-3", @ViewBuilder content: () -> Content) {
        self.role = role
        self.padding = padding
        self.content = content()
    }

    public var body: some View {
        content
            .padding(theme.dimension(padding))
            .foregroundStyle(theme.color("fg", scheme: scheme))
            .background(theme.color(role, scheme: scheme))
            .clipShape(RoundedRectangle(cornerRadius: theme.dimension("radius")))
            .overlay(RoundedRectangle(cornerRadius: theme.dimension("radius"))
                .strokeBorder(theme.color("border", scheme: scheme)))
    }
}
