declare module '*.yaml' {
    const content: any;
    export default content;
  }
  
  declare module '@pkg/assets/scripts/*' {
    const content: string;
    export default content;
  }
  