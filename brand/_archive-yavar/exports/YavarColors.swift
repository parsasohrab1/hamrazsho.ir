// Yavar (یاور) brand color tokens — iOS / SwiftUI + UIKit.
import UIKit
import SwiftUI

enum YavarColor {
    static let teal = UIColor(red: 14/255, green: 165/255, blue: 164/255, alpha: 1)   // #0EA5A4
    static let amber = UIColor(red: 245/255, green: 166/255, blue: 35/255, alpha: 1)  // #F5A623
    static let navy = UIColor(red: 13/255, green: 20/255, blue: 36/255, alpha: 1)     // #0D1424
    static let cream = UIColor(red: 250/255, green: 240/255, blue: 220/255, alpha: 1) // #FAF0DC
}

extension Color {
    static let yavarTeal = Color(red: 14/255, green: 165/255, blue: 164/255)
    static let yavarAmber = Color(red: 245/255, green: 166/255, blue: 35/255)
    static let yavarNavy = Color(red: 13/255, green: 20/255, blue: 36/255)
    static let yavarCream = Color(red: 250/255, green: 240/255, blue: 220/255)
}
