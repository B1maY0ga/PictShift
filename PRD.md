Product Requirements Document (PRD)
Project: Web-Based Client-Side Image Converter & EXIF Cleaner
1. Overview & Project Goals
A browser-based utility that allows users to convert image formats,
adjust output quality, and remove metadata (EXIF) instantly and
securely, without sending files to third-party servers.
Core Value Proposition
- Privacy-First: All processing takes place on the user's device
  (client-side using HTML5 Canvas and JavaScript).
- Lightning Fast: No upload to a third-party processing server is
  required.
- User-Friendly: A simple workflow with target format selection,
  quality controls, and straightforward downloads.
2. Tech Stack
- Markup & Structure: HTML5 (Canvas API, FileReader API)
- Styling: Tailwind CSS via CDN for a modern UI and Dark Mode
- Core Logic: Vanilla JavaScript (ES6+)
- ZIP Processing: JSZip to package multiple converted outputs into
  a single ZIP file
- Deployment: GitHub Pages / Vercel
3. Target Users
Developers, designers, and general users who want to convert images
(WebP/JPEG/PNG), adjust output quality, and remove location/GPS metadata
from personal photos before sharing them publicly.
4. Current MVP Scope
The initial version focuses on stable core functionality and ease of
use.
1. Drag & Drop / File Picker: An interactive area where users can
   select or drop image files into the browser.
2. Target Format Selection: Users can choose an output format
   (WebP, JPEG, or PNG). The system converts images from their original
   formats.
3. Instant Preview & Download: Converted results appear as small
   thumbnails and can be downloaded individually.
4. Client-Side Processing: Image processing takes place locally in
   the browser.
5. User Flow
1. The user opens the web app.
2. The user selects or drops one or more image files into the browser.
3. The system detects the files and displays the selected image list.
4. The user selects an output format.
5. The user adjusts output quality using a slider, where supported by
   the target format.
6. The user clicks Convert Now.
7. The system processes the images locally in the browser.
8. When processing is complete:
   - For one or two files, each result can be downloaded
     individually.
   - For more than two files, the system automatically provides the
     results as a single ZIP file for convenience.
9. The user downloads the converted output.
6. Next Update Scope
The next update is intentionally limited to the following two simple
improvements. Do not add other features in this iteration.
6.1 Quality Slider
- Add a slider to control the output quality.
- Value range: 10%--100%.
- Display the currently selected percentage.
- Apply the selected value during conversion for formats that support
  quality settings, such as JPEG and WebP.
- For PNG, explain or disable the quality control if the chosen
  implementation does not provide an equivalent lossy quality setting.
- Use a sensible and consistent default value; recommended initial
  value: 80% for supported formats.
- Changing the slider must not modify the source file. The setting
  applies only to the exported output.
6.2 Automatic ZIP for More Than Two Files
- If there are more than two successfully converted files, package
  all successful outputs into a single ZIP file using JSZip.
- If there are one or two successful files, keep the existing
  individual download behavior.
- Include only successfully converted outputs in the ZIP.
- Use a clear ZIP filename, such as converted-images.zip.
- Show a progress/status message while the ZIP is being generated and
  notify the user if any files failed to process.
- Do not generate an empty ZIP when no conversions succeed.
7. Out of Scope for This Update
To keep this update simple, the following items are excluded:
- Custom image resizing.
- Major layout or navigation changes.
- Adding new image formats.
- Image editing features.
- Cloud uploads or server-side processing.
- Large architectural changes that are not required for the two
  features above.
8. Design References
- TinyPNG (tinypng.com): Reference for a minimal design, a clear
  drop zone, and an uncluttered interface.
- Squoosh (squoosh.app): Reference for a clean browser-based image
  conversion and compression experience.
- Convertio (convertio.co): Reference for clear file selection
  actions and easy-to-understand format choices.
- iLoveIMG (iloveimg.com): Reference for consistent layouts and
  navigation between tools.
9. Acceptance Criteria
The update is complete when:
1. The quality slider is visible and adjustable for supported formats.
2. The selected percentage is visible to the user.
3. The selected quality value is actually applied during export.
4. Quality settings do not modify the original files.
5. When more than two conversions succeed, the system provides one ZIP
   containing all successful outputs.
6. When only one or two conversions succeed, users can still download
   each result individually.
7. A failure on one file does not prevent other successfully processed
   files from being downloaded.
8. All processing remains in the browser; images are not uploaded to
   third-party servers.