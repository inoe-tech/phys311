import { Vec2 } from "./engine/vec2.js";

const a = new Vec2(3, 4);
const b = new Vec2(1, -2);

console.log("a.add(b)       =", a.add(b));              // Vec2 {x: 4, y: 2}
console.log("a.sub(b)       =", a.sub(b));              // Vec2 {x: 2, y: 6}
console.log("a.mul(2)       =", a.mul(2));              // Vec2 {x: 6, y: 8}
console.log("a.dot(b)       =", a.dot(b));              // -5
console.log("a.length()     =", a.length());            // 5
console.log("a.lengthSq()   =", a.lengthSq());          // 25
console.log("a.normalized() =", a.normalized());        // Vec2 {x: 0.6, y: 0.8}
console.log("|normalized|   =", a.normalized().length());// 1