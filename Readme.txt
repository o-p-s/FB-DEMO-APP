
	Test App- Fb-Demo 
	>Download this Respoistory : 
	>Run 'npm install' in both the directories frontend,backend-app. 
	>Run 'ng serve' in the frontend directory & 'node index.js' in backend-app directory.
	>Frontend App will be running on http://localhost:4200
	>Backend App will be running on http://localhost:3000


	>Frontend will redirect to http://localhost:4200/welcome
	>Click on 'Facebook' Text appearing under 'Sign in with our Awesome Application'.
	>It will ask for permissions(if already logged in facebook). Grant them as they are only default('public_profile' & 'email').
	>You will be redirected to http://localhost:4200/dashboard.

	Note: Open console to see further outputs
	You'll see an Object with id & 5 feeds with pagination values.
	>Get All Users -> List of All User Models in our database saved using this authentication.
	>Previous Page -> Will Obtain same set of posts (Explained below)
	>Next Page -> Will Obtain same set of posts (Explained below)
	>LogOut -> Removes token stored in localstorage and redirects to http://localhost:4200/welcome.

  
	Explaination 
	Since I have filled the clientId and client_secret of an app created by my account, It cannot ask for permissions such as
	"user_posts,manage_pages,publish_pages" from the logged In user because to avail such permissions on this app we need to 
	undergo App's review process, have to fill more information & then have to wait till approval.
	So, this app have "public_profile" & "email" permissions only. 
	
	But to show user feeds we need "user_posts" permission, but as we don't have I managed to get my feeds over here. So,
	the Next & Previous Page are not gonna work until we provide it an app, that have user_posts permission and some changes
	are need to be done. 
	This is so because all the uri's whether for fetching first page, next page or previous page needs to be go through 
	/${userId}/feed and here I am providing my feeds so they don't work with that url. Check out the below function for more info.
	A small change needs to done in the function fetchPosts() defined in postsController.js if we have credentails of such app. 
	(I've commented the code that needs to be changed) and

	=>In Node App or backend-app, 
	In passport middleware: .\config\passposrtConfig.js
	Make changes to 
	  > passportConfig['client_id'] = "New Client Id"            	  // line 9
	  > passportConfig['client_secret']= "New Client Secret"          //line 10

	=> In angular App or frontend App,
	In Directory, .\src\app\user.service.ts
	Make changes to 
	    FB.init({
		appId	: " New client Id"				  //line 1
	    })
	If we have an app with other permissions, then we've to add the permssions to scope(in the above file) aswell.   // Line 34

	