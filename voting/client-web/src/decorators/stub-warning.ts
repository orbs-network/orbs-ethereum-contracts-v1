export const stubWarning = () => {
  return function(target: any, propertyKey: string) {
    console.log(`${propertyKey} is not available in read-only mode`);
  };
};
