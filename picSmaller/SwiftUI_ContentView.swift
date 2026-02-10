import SwiftUI
import PhotosUI
import UniformTypeIdentifiers
import Combine
import Photos // Added for saving to Photos App

// MARK: - Main View
struct ContentView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var originalImage: UIImage?
    @State private var filename: String = "No Image Selected"
    @State private var originalSize: Int64 = 0
    
    @State private var preset: String = "High"
    @State private var customDim: String = ""
    @State private var outputFormat: String = "JPEG"
    @State private var quality: Double = 0.85
    
    @State private var showSavePanel = false
    @State private var exportedFileData: Data?
    @State private var showingSuccess = false
    @State private var alertMessage = ""
    @State private var showAlert = false
    
    // Dynamic Sky State
    @State private var skyColors: [Color] = [.black, .black]
    let timer = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            // MARK: - Dynamic Atmospheric Background
            LinearGradient(gradient: Gradient(colors: skyColors), startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
                .onAppear(perform: updateAtmosphere)
                .onReceive(timer) { _ in updateAtmosphere() }
            
            VStack(spacing: 24) {
                Spacer()
                
                // MARK: - Upload Area (Hidden when image selected)
                if originalImage == nil {
                    PhotosPicker(selection: $selectedItem, matching: .images) {
                        VStack(spacing: 16) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 48))
                                .foregroundStyle(.linearGradient(colors: [.blue, .cyan], startPoint: .top, endPoint: .bottom))
                            Text("Tap to Select Image")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text("Choose any image to resize and convert native JXL/HEIF.")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.6))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 300)
                        .background(.ultraThinMaterial)
                        .cornerRadius(40)
                        .overlay(RoundedRectangle(cornerRadius: 40).stroke(.white.opacity(0.1), lineWidth: 1))
                        .padding()
                    }
                }

                // MARK: - Main Platter
                if let img = originalImage {
                    VStack(spacing: 0) {
                        // Header
                        HStack(spacing: 16) {
                            Image(uiImage: img)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: 80, height: 80)
                                .cornerRadius(12)
                                .clipped()
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.1), lineWidth: 1))
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(filename)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .lineLimit(1)
                                Text(formatBytes(originalSize))
                                    .font(.system(size: 14))
                                    .foregroundColor(.white.opacity(0.6))
                            }
                            Spacer()
                            Button(action: resetApp) {
                                Image(systemName: "arrow.counterclockwise")
                                    .foregroundColor(.white.opacity(0.6))
                            }
                        }
                        .padding(20)
                        .background(.white.opacity(0.03))
                        
                        Divider().background(.white.opacity(0.1))
                        
                        // Controls
                        ScrollView {
                            VStack(alignment: .leading, spacing: 20) {
                                // Presets
                                ControlLabel("RESIZE PRESET")
                                HStack {
                                    PresetBtn(title: "Low", active: preset == "Low") { preset = "Low" }
                                    PresetBtn(title: "Med", active: preset == "Med") { preset = "Med" }
                                    PresetBtn(title: "High", active: preset == "High") { preset = "High" }
                                    PresetBtn(title: "Custom", active: preset == "Custom") { preset = "Custom" }
                                }
                                
                                if preset == "Custom" {
                                    TextField("Enter longest edge px...", text: $customDim)
                                        .keyboardType(.numberPad)
                                        .padding()
                                        .background(Color.white.opacity(0.1))
                                        .cornerRadius(12)
                                        .foregroundColor(.white)
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.blue, lineWidth: 1))
                                }
                                
                                // Format
                                ControlLabel("EXPORT FORMAT")
                                HStack {
                                    FormatBtn(title: "JPEG", color: Color(hex: "ffb7b2"), active: outputFormat == "JPEG") { outputFormat = "JPEG" }
                                    FormatBtn(title: "PNG", color: Color(hex: "b2e2f2"), active: outputFormat == "PNG") { outputFormat = "PNG" }
                                    FormatBtn(title: "JXL", color: Color(hex: "b2f2bb"), active: outputFormat == "JXL") { outputFormat = "JXL" }
                                    FormatBtn(title: "HEIC", color: Color(hex: "f2e2b2"), active: outputFormat == "HEIC") { outputFormat = "HEIC" }
                                }
                                
                                if outputFormat == "JPEG" || outputFormat == "HEIC" {
                                    VStack {
                                        HStack {
                                            ControlLabel("QUALITY")
                                            Spacer()
                                            Text("\(Int(quality * 100))%")
                                                .font(.caption.bold())
                                                .foregroundColor(.white)
                                        }
                                        Slider(value: $quality, in: 0.1...1.0)
                                    }
                                }
                                
                                // info
                                VStack(alignment: .leading, spacing: 8) {
                                    let dims = calculateNewSize(original: img.size)
                                    Text("New Dimensions: \(Int(dims.width)) x \(Int(dims.height))")
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.6))
                                    
                                    HStack {
                                        Text("Action:")
                                            .font(.caption)
                                            .foregroundColor(.white.opacity(0.6))
                                        Text("Save to Photos Library")
                                            .font(.caption.bold())
                                            .foregroundColor(.blue)
                                    }
                                }
                                .padding(.top, 8)
                            }
                            .padding(20)
                        }
                    }
                    .background(.ultraThinMaterial)
                    .cornerRadius(32)
                    .padding()
                    .frame(maxHeight: 600)
                }
                
                Spacer()
                
                // MARK: - Save Button
                if originalImage != nil {
                    Button(action: processAndSaveToPhotos) {
                        Text("Save to Photos")
                            .font(.headline.bold())
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(16)
                            .shadow(color: .blue.opacity(0.4), radius: 10, y: 5)
                            .padding(.horizontal, 40)
                            .padding(.bottom, 20)
                    }
                }
            }
            
            if showingSuccess {
                Text("Saved to Gallery! ✨")
                    .padding()
                    .background(.black.opacity(0.8))
                    .foregroundColor(.white)
                    .cornerRadius(20)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            withAnimation { showingSuccess = false }
                        }
                    }
            }
        }
        .alert(alertMessage, isPresented: $showAlert) {
            Button("OK", role: .cancel) { }
        }
        .onChange(of: selectedItem) { newItem in
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    originalImage = uiImage
                    originalSize = Int64(data.count)
                    filename = newItem?.itemIdentifier ?? "image.jpg"
                }
            }
        }
    }

    // MARK: - Helpers
    
    func resetApp() {
        originalImage = nil
        selectedItem = nil
        customDim = ""
    }
    
    func formatBytes(_ bytes: Int64) -> String {
        ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)
    }
    
    func calculateNewSize(original: CGSize) -> CGSize {
        let isLandscape = original.width >= original.height
        let targetLongest: CGFloat
        
        switch preset {
        case "Low": targetLongest = 640
        case "Med": targetLongest = 1280
        case "High": return original
        case "Custom": targetLongest = CGFloat(Double(customDim) ?? Double(max(original.width, original.height)))
        default: targetLongest = 1280
        }
        
        if isLandscape {
            let ratio = targetLongest / original.width
            return CGSize(width: targetLongest, height: original.height * ratio)
        } else {
            let ratio = targetLongest / original.height
            return CGSize(width: original.width * ratio, height: targetLongest)
        }
    }
    
    func processAndSaveToPhotos() {
        guard let img = originalImage else { return }
        let newSize = calculateNewSize(original: img.size)
        
        // Native Resize
        let renderer = UIGraphicsImageRenderer(size: newSize)
        let resizedImage = renderer.image { _ in
            img.draw(in: CGRect(origin: .zero, size: newSize))
        }
        
        let formatData: Data?
        switch outputFormat {
        case "JPEG":
            formatData = resizedImage.jpegData(compressionQuality: quality)
        case "PNG":
            formatData = resizedImage.pngData()
        case "HEIC":
            formatData = resizedImage.heicData(compressionQuality: quality)
        case "JXL":
            formatData = resizedImage.jxlData()
            if formatData == nil {
                alertMessage = "JXL is not yet supported for encoding on this device version."
                showAlert = true
                return
            }
        default:
            formatData = resizedImage.jpegData(compressionQuality: quality)
        }
        
        guard let finalData = formatData else { return }
        
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            if status == .authorized || status == .limited {
                PHPhotoLibrary.shared().performChanges({
                    let request = PHAssetCreationRequest.forAsset()
                    request.addResource(with: .photo, data: finalData, options: nil)
                }) { success, error in
                    DispatchQueue.main.async {
                        if success {
                            withAnimation { showingSuccess = true }
                        } else {
                            alertMessage = "Save failed: \(error?.localizedDescription ?? "Unknown error")"
                            showAlert = true
                        }
                    }
                }
            } else {
                DispatchQueue.main.async {
                    alertMessage = "Please allow photo library access in Settings."
                    showAlert = true
                }
            }
        }
    }
    
    func updateAtmosphere() {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour >= 6 && hour < 18 {
            skyColors = [Color(hex: "0a2e5c"), Color(hex: "7db9e8")]
        } else {
            skyColors = [Color(hex: "141617"), Color(hex: "1a0b00")]
        }
    }
}

// MARK: - Subviews
struct ControlLabel: View {
    let title: String
    init(_ title: String) { self.title = title }
    var body: some View {
        Text(title)
            .font(.system(size: 11, weight: .bold))
            .foregroundColor(.white.opacity(0.5))
            .kerning(1)
    }
}

struct PresetBtn: View {
    let title: String
    let active: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(active ? Color.blue : Color.white.opacity(0.1))
                .cornerRadius(12)
        }
    }
}

struct FormatBtn: View {
    let title: String
    let color: Color
    let active: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(color)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(active ? color.opacity(0.3) : Color.white.opacity(0.1))
                .cornerRadius(12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(active ? color : Color.clear, lineWidth: 1))
        }
    }
}

// MARK: - Data Extensions
extension UIImage {
    func heicData(compressionQuality: Double) -> Data? {
        guard let mutableData = CFDataCreateMutable(nil, 0),
              let destination = CGImageDestinationCreateWithData(mutableData, UTType.heic.identifier as CFString, 1, nil),
              let cgImage = self.cgImage else { return nil }
        let options: [CFString: Any] = [kCGImageDestinationLossyCompressionQuality: compressionQuality]
        CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)
        CGImageDestinationFinalize(destination)
        return mutableData as Data
    }
    
    func jxlData() -> Data? {
        guard let mutableData = CFDataCreateMutable(nil, 0),
              let destination = CGImageDestinationCreateWithData(mutableData, "com.apple.pixel-jxl" as CFString, 1, nil),
              let cgImage = self.cgImage else { return nil }
        CGImageDestinationAddImage(destination, cgImage, nil)
        if CGImageDestinationFinalize(destination) {
            return mutableData as Data
        }
        return nil
    }
}

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        self.init(red: Double((rgbValue & 0xff0000) >> 16) / 255.0,
                  green: Double((rgbValue & 0x00ff00) >> 8) / 255.0,
                  blue: Double(rgbValue & 0x0000ff) / 255.0)
    }
}
