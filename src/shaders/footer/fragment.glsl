precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;       // taille du canvas, px device
uniform vec2 uImageResolution;  // taille naturelle de la texture, px
uniform vec2 uMouse;            // position curseur lissée, uv 0..1 (y vers le haut)
uniform vec2 uVelocity;         // vélocité curseur lissée (uv/s, déjà amplifiée côté JS)
uniform float uStrength;        // intensité courante de la déformation souris, 0..1
uniform float uRadius;          // rayon d'influence souris, uv écran corrigé du ratio
uniform float uTime;            // temps accumulé (somme des dt), continu même après une pause de la loop
uniform float uIdleStrength;    // amplitude du mouvement liquide au repos (uv, quelques millièmes)
uniform float uIdleSpeed;       // vitesse d'évolution du mouvement liquide au repos
uniform float uZoom;            // zoom léger dans l'image (1.0 = rendu actuel, >1.0 = zoom avant)

// --- Bruit de valeur + fbm bas de gamme : flux organique non périodique
// (contrairement à un sin/cos, qui produirait des vagues régulières). ---
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 2; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Deux échantillons de fbm, décalés dans le domaine du bruit, donnent les deux
// composantes d'un vecteur de flux basse fréquence : les masses se déforment
// lentement dans des directions qui varient elles-mêmes de façon organique.
vec2 idleFlow(vec2 uv, float time) {
  float t = time * uIdleSpeed;
  float n1 = fbm(uv * 1.2 + vec2(0.0, t));
  float n2 = fbm(uv * 1.2 + vec2(5.2, -t) + 3.7);

  // fbm (2 octaves, amplitudes 0.5 + 0.25) culmine à 0.75, pas 1.0 : on
  // renormalise sur 0..1 avant de recentrer, sinon le champ garde un biais
  // directionnel permanent au lieu d'osciller autour de zéro.
  vec2 flow = vec2(n1, n2) / 0.75;
  return (flow - 0.5) * 2.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // distance au curseur en espace écran (coordonnées non déformées), corrigée
  // du ratio -> influence circulaire
  float canvasRatio = uResolution.x / uResolution.y;
  vec2 diff = uv - uMouse;
  diff.x *= canvasRatio;
  float dist = length(diff);
  float influence = smoothstep(uRadius, 0.0, dist);

  // 1) mouvement liquide au repos, toujours actif, indépendant de la souris
  vec2 idleOffset = idleFlow(uv, uTime) * uIdleStrength;

  // 2) déformation locale souris (inchangée), additionnée à l'idle — les deux
  // se combinent, aucune des deux ne remplace l'autre. Toujours en espace
  // écran, AVANT la transformation "cover" (même raison qu'avant : un offset
  // uv serait mal mis à l'échelle s'il était appliqué après coverScale).
  vec2 mouseOffset = uVelocity * influence * uStrength;

  vec2 distortedScreenUv = uv + idleOffset - mouseOffset;

  // object-fit: cover, appliqué APRÈS les deux déformations
  float imageRatio = uImageResolution.x / uImageResolution.y;
  vec2 coverScale = vec2(
    min(canvasRatio / imageRatio, 1.0),
    min(imageRatio / canvasRatio, 1.0)
  );
  vec2 finalUv = (distortedScreenUv - 0.5) * (coverScale / uZoom) + 0.5;

  gl_FragColor = texture2D(uTexture, finalUv);
}
