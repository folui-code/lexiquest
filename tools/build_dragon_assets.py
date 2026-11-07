import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def draw_dragon_silhouette(draw, cx, cy, scale=1.0, color=(15, 10, 25, 255)):
    """Draws a detailed, dramatic dragon shadow silhouette centered at (cx, cy)."""
    # Wing Left
    wing_l = [
        (cx - 10*scale, cy - 20*scale),
        (cx - 60*scale, cy - 120*scale),
        (cx - 120*scale, cy - 130*scale),
        (cx - 100*scale, cy - 80*scale),
        (cx - 130*scale, cy - 60*scale),
        (cx - 90*scale, cy - 30*scale),
        (cx - 110*scale, cy - 10*scale),
        (cx - 60*scale, cy + 10*scale),
        (cx - 20*scale, cy + 10*scale),
    ]
    # Wing Right
    wing_r = [
        (cx + 10*scale, cy - 20*scale),
        (cx + 60*scale, cy - 120*scale),
        (cx + 120*scale, cy - 130*scale),
        (cx + 100*scale, cy - 80*scale),
        (cx + 130*scale, cy - 60*scale),
        (cx + 90*scale, cy - 30*scale),
        (cx + 110*scale, cy - 10*scale),
        (cx + 60*scale, cy + 10*scale),
        (cx + 20*scale, cy + 10*scale),
    ]
    # Dragon Body & Neck
    body = [
        (cx, cy - 110*scale), # Head tip / snout
        (cx + 15*scale, cy - 118*scale), # Upper horn
        (cx + 5*scale, cy - 105*scale),
        (cx + 18*scale, cy - 108*scale), # Lower horn
        (cx + 8*scale, cy - 95*scale), # Jaw
        (cx + 5*scale, cy - 80*scale), # Neck
        (cx + 15*scale, cy - 40*scale), # Chest
        (cx + 25*scale, cy + 20*scale), # Flank
        (cx + 15*scale, cy + 70*scale), # Hindquarter
        (cx + 35*scale, cy + 110*scale), # Tail curve right
        (cx + 20*scale, cy + 140*scale),
        (cx - 10*scale, cy + 160*scale), # Tail tip
        (cx + 5*scale, cy + 130*scale),
        (cx + 5*scale, cy + 90*scale),
        (cx - 15*scale, cy + 70*scale),
        (cx - 25*scale, cy + 20*scale),
        (cx - 15*scale, cy - 40*scale),
        (cx - 5*scale, cy - 80*scale),
        (cx - 12*scale, cy - 95*scale), # Jaw left
        (cx - 18*scale, cy - 108*scale), # Horn left
        (cx - 5*scale, cy - 105*scale),
        (cx - 15*scale, cy - 118*scale), # Upper horn left
    ]
    draw.polygon(wing_l, fill=color)
    draw.polygon(wing_r, fill=color)
    draw.polygon(body, fill=color)

def make_crest():
    w, h = 280, 540
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    
    # Glow layer
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    
    # Shield shape points
    shield_pts = [
        (30, 40), (w - 30, 40),
        (w - 30, 360),
        (w // 2, 480),
        (30, 360)
    ]
    
    # Draw radiant purple aura
    gdraw.polygon(shield_pts, fill=(168, 85, 247, 80))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    im.paste(glow, (0, 0), glow)
    
    draw = ImageDraw.Draw(im)
    
    # Shield fill: Deep obsidian royal purple
    draw.polygon(shield_pts, fill=(18, 12, 28, 245), outline=(192, 132, 252, 230), width=4)
    # Inner border
    inner_pts = [
        (38, 48), (w - 38, 48),
        (w - 38, 355),
        (w // 2, 468),
        (38, 355)
    ]
    draw.polygon(inner_pts, outline=(245, 158, 11, 160), width=2)
    
    # Dragon Shadow Silhouette
    # Draw glow underneath
    d_glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dg_draw = ImageDraw.Draw(d_glow)
    draw_dragon_silhouette(dg_draw, w // 2, 230, scale=0.95, color=(192, 132, 252, 140))
    d_glow = d_glow.filter(ImageFilter.GaussianBlur(10))
    im.paste(d_glow, (0, 0), d_glow)
    
    # Solid black dragon silhouette
    draw_dragon_silhouette(draw, w // 2, 230, scale=0.92, color=(10, 5, 18, 255))
    
    # Glowing violet/gold dragon eyes
    eye_y = 230 - int(105 * 0.92)
    draw.ellipse((w // 2 - 6, eye_y - 2, w // 2 - 2, eye_y + 2), fill=(251, 191, 36, 255))
    draw.ellipse((w // 2 + 2, eye_y - 2, w // 2 + 6, eye_y + 2), fill=(251, 191, 36, 255))
    
    # Header Banner: HOUSE OF DRAGON
    banner_box = [(40, 385), (w - 40, 425)]
    draw.rectangle(banner_box, fill=(15, 10, 25, 240), outline=(245, 158, 11, 200), width=2)
    draw.text((w // 2, 405), "HOUSE OF DRAGON", fill="#f8fafc", anchor="mm")
    
    # Footer tag: FACULTY
    draw.text((w // 2, 442), "✦ FACULTY ORDER ✦", fill="#c084fc", anchor="mm")

    im.save('/Users/kelvinluimacbookair/.gemini/antigravity-ide/scratch/vocab-game/assets/houses/crests/dragon.png')
    print("Saved crests/dragon.png successfully!")

def make_avatar():
    w, h = 300, 408
    im = Image.new('RGB', (w, h), (15, 10, 25))
    draw = ImageDraw.Draw(im)
    
    # Mystic background gradient
    for y in range(h):
        ratio = y / h
        r = int(15 + ratio * 20)
        g = int(8 + ratio * 10)
        b = int(32 + ratio * 40)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
        
    # Ambient arcane moonlight circle
    moon = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(moon)
    mdraw.ellipse((w//2 - 90, 80, w//2 + 90, 260), fill=(168, 85, 247, 90))
    moon = moon.filter(ImageFilter.GaussianBlur(35))
    im.paste(moon, (0, 0), moon)
    
    # Dragon Shadow Silhouette
    d_im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(d_im)
    
    # Glow outline
    draw_dragon_silhouette(ddraw, w // 2, 220, scale=1.12, color=(192, 132, 252, 160))
    d_glow = d_im.filter(ImageFilter.GaussianBlur(12))
    im.paste(d_glow, (0, 0), d_glow)
    
    # Main dark shadow dragon
    d_solid = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dsdraw = ImageDraw.Draw(d_solid)
    draw_dragon_silhouette(dsdraw, w // 2, 220, scale=1.08, color=(8, 4, 15, 255))
    im.paste(d_solid, (0, 0), d_solid)
    
    # Fiery arcane eyes
    draw = ImageDraw.Draw(im)
    eye_y = 220 - int(105 * 1.08)
    draw.ellipse((w // 2 - 7, eye_y - 2, w // 2 - 2, eye_y + 3), fill=(245, 158, 11))
    draw.ellipse((w // 2 + 2, eye_y - 2, w // 2 + 7, eye_y + 3), fill=(245, 158, 11))
    
    im.save('/Users/kelvinluimacbookair/.gemini/antigravity-ide/scratch/vocab-game/assets/houses/avatars/dragon.png')
    print("Saved avatars/dragon.png successfully!")

make_crest()
make_avatar()
