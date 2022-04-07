interface Constructable {
  new(...args: any[]): any;
}
const serviceMap = new Map<string, Constructable>();

class Testing {
  get string() {
   return 'hey jim';
  }
}

function Injectable(constructor: Constructable) {
  console.log('constructor name', constructor.name);
  serviceMap.set(constructor.name, constructor);
}

function Inject(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  console.info(target, propertyKey, parameterIndex);
}


@Injectable
class Something {

}
