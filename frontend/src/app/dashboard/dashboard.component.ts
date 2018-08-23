import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public currentPage;
  public page;
  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
    this.userService.getUserPosts(this.page).then((posts) =>{ console.log(posts);this.currentPage=posts;})
        .catch(() => this.currentPage = {});
  }
  public getNextPage=()=>{
     this.page={
        'token':this.currentPage.feed.pagination.nextPage,
        'until':this.currentPage.feed.pagination.until
      }
      this.userService.getUserPosts(this.page).then((posts) => {console.log(posts);this.currentPage=posts;})
      .catch(() => this.currentPage = {});
  
  }
  public getPreviousPage=()=>{
    this.page={
      'token':this.currentPage.feed.pagination.previousPage,
      'previous':this.currentPage.feed.pagination.previous,
      'since':this.currentPage.feed.pagination.since
    }
    this.userService.getUserPosts(this.page).then((posts) => {console.log(posts);this.currentPage=posts;})
    .catch(() => this.currentPage = {});
    
  }

  public getAllUsers(){
    this.userService.getAllUsers().subscribe((res)=>{
      console.log(res);
    });
  }
  logout() {
    this.userService.logout();
    this.router.navigate(['/welcome']);
  }

}
