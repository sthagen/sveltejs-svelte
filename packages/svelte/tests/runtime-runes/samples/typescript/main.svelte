<script module lang="ts">
	interface Hello {
		message: 'hello';
	}
	type Goodbye = { message: 'goodbye' };

	function this_fn(this: any) {
		console.log(this);
	}

	function foo<T>(): string {
		return ""!;
	}

	class Foo<T> {
		public name: string;
		declare bar: string;
		x = 'x' as const;
		constructor(name: string) {
			this.name = name;
		}
	}

	class MyClass implements Hello {}

	abstract class MyAbstractClass {
		abstract x(): void;
		y() {}
	}

	declare const declared_const: number;
	declare function declared_fn(): void;
	declare class declared_class {
		foo: number;
	}

	declare module 'foobar' {}
	namespace SomeNamespace {
		export type Foo = true;
	}

	export function overload(a: boolean): boolean;
	export function overload(b: string): number;
	export function overload(c: any): any {}

	export type { Hello };

	const TypedFoo = Foo<true>;
	const typeAssertion = <boolean>true;
	const x = foo<true>();
</script>

<script>
	import type { Foo } from './types';
	import { type Bar, type Baz } from './types';

	let count = $state(0);
	const person = {
		message: 'goodbye'
	} satisfies Goodbye;
</script>

<button on:click={(e: MouseEvent) => {
		const next: number = count + 1;
		count = next! as number;
	}}
	>clicks: {count}</button
>
