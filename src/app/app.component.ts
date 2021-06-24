import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { Task } from './task/task';
import { MatDialog } from "@angular/material/dialog";
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

const getObservable = (collection: AngularFirestoreCollection<Task>) => {
  const subject = new BehaviorSubject([]);
  collection.valueChanges({idField: 'id'}).subscribe((val: any) => {
    subject.next(val);
  });
  return subject;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angularFirebase';

  todo = getObservable(this.store.collection('todo'));
  inProgress = getObservable(this.store.collection('inProgress'));
  done = getObservable(this.store.collection('done'));

  constructor(private dialog: MatDialog, private store: AngularFirestore) { }

drop(event: CdkDragDrop<any>): void{
if(event.previousContainer === event.container){
  return;
}
const item = event.previousContainer.data[event.previousIndex];
this.store.firestore.runTransaction(()=>{
  return Promise.all([
    this.store.collection(event.previousContainer.id).doc(item.id).delete(),
    this.store.collection(event.container.id).add(item)
  ])
})
transferArrayItem(
  event.previousContainer.data,
  event.container.data,
  event.previousIndex,
  event.currentIndex
)
}

edit(list: 'done' |'inProgress' | 'todo', task: Task): void{
  const dialogRef = this.dialog.open(TaskDialogComponent,{
    width: '270px',
    data:{
      task,
      enableDelete: true
    }
  });
  dialogRef.afterClosed().subscribe((result: TaskDialogResult) =>{
   if (result.delete){
     this.store.collection(list).doc(task.id).delete();
   }else{
     this.store.collection(list).doc(task.id).update(task)
   }

  })
}

newTask(){
  const dialogRef = this.dialog.open(TaskDialogComponent,{
    width: '270px',
    data: {
      task: {}
    }
  });

  dialogRef
  .afterClosed()
  .subscribe((result: TaskDialogResult) => this.store.collection('todo').add(result.task));
}



}
