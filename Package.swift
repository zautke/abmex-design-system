// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AbmexDesignSystem",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [
        .library(name: "AbmexTokens", targets: ["AbmexTokens"]),
        .library(name: "AbmexUI", targets: ["AbmexUI"])
    ],
    targets: [
        .target(name: "AbmexTokens"),
        .target(name: "AbmexUI", dependencies: ["AbmexTokens"]),
        .testTarget(name: "AbmexUITests", dependencies: ["AbmexUI", "AbmexTokens"], path: "tests/AbmexUITests")
    ]
)
