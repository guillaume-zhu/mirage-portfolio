precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;       // taille du canvas, px device
uniform vec2 uImageResolution;  // taille naturelle de la texture, px
uniform vec2 uMouse;            // position curseur lissée, uv 0..1 (y vers le haut)
uniform vec2 uVelocity;         // vélocité curseur lissée (uv/s, déjà amplifiée côté JS)
uniform float uStrength;        // intensité courante de la déformation, 0..1
uniform float uRadius;          // rayon d'influence, uv écran corrigé du ratio

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // distance au curseur en espace écran, corrigée du ratio -> influence circulaire
  float canvasRatio = uResolution.x / uResolution.y;
  vec2 diff = uv - uMouse;
  diff.x *= canvasRatio;
  float dist = length(diff);
  float influence = smoothstep(uRadius, 0.0, dist);

  // Déformation appliquée en espace écran (mêmes unités que uMouse/uRadius/
  // uVelocity), AVANT la transformation "cover" : l'amplitude visuelle reste
  // ainsi cohérente quel que soit le ratio image/canvas — un offset exprimé en
  // uv écran serait mal mis à l'échelle s'il était appliqué après coverScale.
  vec2 distortedScreenUv = uv - uVelocity * influence * uStrength;

  // object-fit: cover, appliqué APRÈS la déformation
  float imageRatio = uImageResolution.x / uImageResolution.y;
  vec2 coverScale = vec2(
    min(canvasRatio / imageRatio, 1.0),
    min(imageRatio / canvasRatio, 1.0)
  );
  vec2 finalUv = (distortedScreenUv - 0.5) * coverScale + 0.5;

  gl_FragColor = texture2D(uTexture, finalUv);
}
