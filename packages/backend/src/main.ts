import "tsconfig-paths/register";
import { B } from "./service-B/b";

function main(): void {
  console.log("Hello, swc!");
  const b = new B();
  b.printDate();
}

main();
