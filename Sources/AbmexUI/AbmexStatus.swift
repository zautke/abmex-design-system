import SwiftUI

public enum AbmexTone: String, CaseIterable {
    case neutral, info, success, warning, danger

    public var foregroundRole: String { self == .neutral ? "fg-muted" : "\(rawValue)-soft-fg" }
    public var backgroundRole: String { self == .neutral ? "surface-2" : "\(rawValue)-soft" }
    public var symbol: String {
        switch self {
        case .neutral: return "circle.fill"
        case .info: return "info.circle"
        case .success: return "checkmark.circle"
        case .warning: return "exclamationmark.triangle"
        case .danger: return "exclamationmark.circle"
        }
    }
}

/// A status always includes text and a symbol, so color is never its only signal.
public struct AbmexStatus<Label: View>: View {
    @Environment(\.abmexTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    private let tone: AbmexTone
    private let label: Label

    public init(tone: AbmexTone = .neutral, @ViewBuilder label: () -> Label) {
        self.tone = tone
        self.label = label()
    }

    public var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: theme.dimension("space-2")) {
            Image(systemName: tone.symbol).accessibilityHidden(true)
            label
        }
        .font(.callout)
        .foregroundStyle(theme.color(tone.foregroundRole, scheme: scheme))
        .accessibilityElement(children: .combine)
    }
}

public extension AbmexStatus where Label == Text {
    init(_ title: LocalizedStringKey, tone: AbmexTone = .neutral) {
        self.init(tone: tone) { Text(title) }
    }
}

/// A message with caller-supplied actions, including an optional dismiss button.
public struct AbmexNotice<Content: View, Actions: View>: View {
    @Environment(\.abmexTheme) private var theme
    private let tone: AbmexTone
    private let content: Content
    private let actions: Actions

    public init(tone: AbmexTone = .info, @ViewBuilder content: () -> Content, @ViewBuilder actions: () -> Actions) {
        self.tone = tone
        self.content = content()
        self.actions = actions()
    }

    public var body: some View {
        AbmexSurface(role: tone.backgroundRole) {
            VStack(alignment: .leading, spacing: theme.dimension("space-2")) {
                AbmexStatus(tone: tone) { content }
                actions
            }
        }
    }
}

public extension AbmexNotice where Actions == EmptyView {
    init(tone: AbmexTone = .info, @ViewBuilder content: () -> Content) {
        self.init(tone: tone, content: content, actions: { EmptyView() })
    }
}
