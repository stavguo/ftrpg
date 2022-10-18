// Fork of https://glslsandbox.com/e#82541.5
// Colours adjusted
// Values changed to give a more "pixelated" look
// General messing around

precision highp float;

uniform float time;
vec2 resolution = vec2(240, 160);

float random(vec2 pos) {
	return fract(4. * sin(pos.y + fract(80.0 * sin(pos.x))));
}

float noise(vec2 pos) {
	vec2 i = floor(pos);
	vec2 f = fract(pos);
	float a = random(i + vec2(0.0, 0.0));
	float b = random(i + vec2(1.0, 0.0));
	float c = random(i + vec2(0.0, 1.0));
	float d = random(i + vec2(1.0, 1.0));
	vec2 u = f * f * (1.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1. - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 pos) {
	float v = 0.20;
	float a = 0.65;
	vec2 shift = vec2(0.0);
	
	mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
	for (int i=0; i < 4; i++) {
		v += a * noise(pos);
		pos = rot * pos * 4. + shift;
		a *= 0.5;
	}
	return v;
}

void main() {
	vec2 pos = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
	float f = fbm(pos * 7.0 * vec2(fbm(pos - (time / 16.0)), fbm(pos / 2.0 - (time / 48.0))));
	
	vec3 colour = vec3(0.03, 0.45, 0.76);
	colour = (f * 1.5) * colour;
	gl_FragColor = vec4(colour, 1.0);
}