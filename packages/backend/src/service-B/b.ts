import { A } from "@app/service-A/a";
import { getDate } from "@generated/some-api/api";

export class B {
  #a = new A();

  printDate() {
    this.#a.print(getDate().toISOString());
  }
}
