function A() {
	this.data = 'foo';
}

function B() {
	this.A = null;
}

var shared = new A();
var alpha = new B();
var beta = new B();
alpha.A = shared;
beta.A = shared;
alpha.A.data = 'bar';
console.log(beta.A.data);
