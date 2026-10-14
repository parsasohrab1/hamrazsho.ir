// Hamraz brand color tokens — iOS / SwiftUI + UIKit.
import UIKit
import SwiftUI

enum HamrazColor {
    static let lapis = UIColor(red: 22/255, green: 36/255, blue: 92/255, alpha: 1)       // #16245C
    static let turquoise = UIColor(red: 43/255, green: 179/255, blue: 170/255, alpha: 1) // #2BB3AA
    static let gold = UIColor(red: 224/255, green: 169/255, blue: 59/255, alpha: 1)      // #E0A93B
    static let ivory = UIColor(red: 247/255, green: 241/255, blue: 227/255, alpha: 1)    // #F7F1E3
    static let night = UIColor(red: 11/255, green: 18/255, blue: 51/255, alpha: 1)       // #0B1233
}

extension Color {
    static let hamrazLapis = Color(red: 22/255, green: 36/255, blue: 92/255)
    static let hamrazTurquoise = Color(red: 43/255, green: 179/255, blue: 170/255)
    static let hamrazGold = Color(red: 224/255, green: 169/255, blue: 59/255)
    static let hamrazIvory = Color(red: 247/255, green: 241/255, blue: 227/255)
    static let hamrazNight = Color(red: 11/255, green: 18/255, blue: 51/255)
}
