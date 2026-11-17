// Transient broad phase only: exact hit geometry and every visible effect stay unchanged.
export class SpatialGrid{
 constructor(items,cell=112){this.cell=cell;this.buckets=new Map();for(const item of items){const x=Math.floor(item.x/cell),y=Math.floor(item.y/cell),key=x+','+y;let bucket=this.buckets.get(key);if(!bucket)this.buckets.set(key,bucket=[]);bucket.push(item);}}
 box(left,top,right,bottom){const result=[];for(let x=Math.floor(left/this.cell);x<=Math.floor(right/this.cell);x++)for(let y=Math.floor(top/this.cell);y<=Math.floor(bottom/this.cell);y++){const bucket=this.buckets.get(x+','+y);if(bucket)for(const item of bucket)result.push(item);}return result;}
 near(x,y,radius){return this.box(x-radius,y-radius,x+radius,y+radius);}
}
