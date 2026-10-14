import os
from pptx import Presentation
from pptx.util import Inches

print("Compiling final PowerPoint presentation Waste2Worth_Sociothon26.pptx...")

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

for i in range(1, 10):
    slide_path = f"final_slides/slide_{i}.png"
    if os.path.exists(slide_path):
        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(slide_path, Inches(0), Inches(0), width=Inches(13.333), height=Inches(7.5))
        print(f"Added slide {i} to PPTX")

pptx_path = "Waste2Worth_Sociothon26.pptx"
prs.save(pptx_path)
print(f"Successfully saved {pptx_path} with all 9 widescreen 16:9 slides!")
