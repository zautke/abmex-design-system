import math
def srgb_to_lin(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def lin_to_srgb(c): return 12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
def hex_to_rgb(h):
    h=h.lstrip('#'); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
def rgb_to_hex(rgb): return '#'+''.join(f'{round(max(0,min(1,c))*255):02x}' for c in rgb)
def rgb_to_oklab(rgb):
    r,g,b=[srgb_to_lin(c) for c in rgb]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b
    m=0.2119034982*r+0.6806995451*g+0.1073969566*b
    s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=[x**(1/3) if x>=0 else -((-x)**(1/3)) for x in (l,m,s)]
    return (0.2104542553*l+0.7936177850*m-0.0040720468*s,
            1.9779984951*l-2.4285922050*m+0.4505937099*s,
            0.0259040371*l+0.7827717662*m-0.8086757660*s)
def oklab_to_rgb_lin(L,a,b):
    l=L+0.3963377774*a+0.2158037573*b; m=L-0.1055613458*a-0.0638541728*b; s=L-0.0894841775*a-1.2914855480*b
    l,m,s=l**3,m**3,s**3
    return (4.0767416621*l-3.3077115913*m+0.2309699292*s,
            -1.2684380046*l+2.6097574011*m-0.3413193965*s,
            -0.0041960863*l-0.7034186147*m+1.7076147010*s)
def hex_to_oklch(h):
    L,a,b=rgb_to_oklab(hex_to_rgb(h)); C=math.hypot(a,b); H=math.degrees(math.atan2(b,a))%360
    return (L,C,H)
def oklch_to_hex(L,C,H):
    # gamut map by reducing chroma
    c=C
    while True:
        a=c*math.cos(math.radians(H)); b=c*math.sin(math.radians(H))
        lin=oklab_to_rgb_lin(L,a,b)
        if all(-1e-4<=x<=1+1e-4 for x in lin) or c<=0: break
        c-=0.002
    return rgb_to_hex([lin_to_srgb(max(0,min(1,x))) for x in lin]), c
def lum(h): r,g,b=[srgb_to_lin(c) for c in hex_to_rgb(h)]; return 0.2126*r+0.7152*g+0.0722*b
def wcag(a,b):
    la,lb=lum(a),lum(b); return (max(la,lb)+0.05)/(min(la,lb)+0.05)
def apca(txt,bg):
    def Y(h):
        r,g,b=hex_to_rgb(h); return 0.2126729*r**2.4+0.7151522*g**2.4+0.0721750*b**2.4
    def clamp(y): return y if y>0.022 else y+(0.022-y)**1.414
    yt,yb=clamp(Y(txt)),clamp(Y(bg))
    if yb>yt: s=(yb**0.56-yt**0.57)*1.14; return 0 if s<0.1 else (s-0.027)*100
    s=(yb**0.65-yt**0.62)*1.14; return 0 if s>-0.1 else (s+0.027)*100
