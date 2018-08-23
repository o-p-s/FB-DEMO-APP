import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';
import {Observable} from 'rxjs';
declare const FB:any;

@Injectable()
export class UserService {
  constructor(private http:HttpClient) {
    FB.init({
      appId      : '2177246142560651',        //update this Id with your clientId
      status     : false, 
      cookie     : false,  
      xfbml      : false,  
      version    : 'v3.1' 
    });
  }
  fbLogin() {
    return new Promise((resolve, reject) => {
      FB.login(result => {
        if (result.authResponse) {
          return this.http.post(`http://localhost:3000/api/v1/auth/facebook`, {access_token: result.authResponse.accessToken})
              .toPromise()
              .then(response => {
                var token = response['data'].authToken;
                if (token) {
                  localStorage.setItem('id_token', token);
                }
                resolve(response);
              })
              .catch(() => reject());
        } else {
          reject();
        }
      }, {scope: 'public_profile,email'})         //add "user_posts,manage_pages,publish_pages"
    });
  }

  logout() {
    localStorage.removeItem('id_token');
  }

  getUserPosts(page) {
    let url:string;
    if(page!==undefined && page!==null && page.until!==undefined)
    url=`http://localhost:3000/api/v1/fetchPosts?authToken=${localStorage.getItem('id_token')}&pageToken=${page.token}&until=${page.until}`
    else if(page!==undefined && page!==null && page.previous!==undefined)
    url=`http://localhost:3000/api/v1/fetchPosts?authToken=${localStorage.getItem('id_token')}&pageToken=${page.token}&since=${page.since}&previous=${page.previous}`
    else
    url=`http://localhost:3000/api/v1/fetchPosts?authToken=${localStorage.getItem('id_token')}`
    
    return new Promise((resolve, reject) => {console.log(page);
      return this.http.get(url)
      .toPromise()
      .then(response => {
        resolve(response['data']);
      }).catch(() => reject());
    });
  }
  public getAllUsers():Observable<any>{
    return this.http.get(`http://localhost:3000/api/v1/get/all/users?authToken=${localStorage.getItem('id_token')}`)
  }
}