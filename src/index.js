import axios from 'axios';
import querystring from 'querystring';
import store from 'store';


const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const corsUrl = 'https://cors-anywhere.herokuapp.com/';
const url = {
    auth    : 'https://www.linkedin.com/oauth/v2/authorization',
    token   : 'https://www.linkedin.com/oauth/v2/accessToken',
    me      : 'https://api.linkedin.com/v2/me'
}

const parameters = new URLSearchParams(window.location.search);
const btnLogin = document.getElementById('linkedin-login');
const wrapper = document.getElementById('profile');

const getEndpoint = (target,cors=true) => (cors?corsUrl:'')+url[target]

const LnkLogin = ()=> {
    const params = {
        response_type:'code',
        client_id: client_id,
        state: Math.floor(Date.now() / 1000),
        redirect_uri: redirect_uri,
        scope: 'r_liteprofile r_emailaddress w_member_social'
    }
    const urlWindow = `${getEndpoint('auth',false)}?${querystring.stringify(params)}`;
    window.open(urlWindow,'_self');
}

const LnkToken = ()=> {
    const config = {
        grant_type : 'authorization_code',
        client_id : client_id,
        client_secret : client_secret ,
        redirect_uri : redirect_uri,
        code : parameters.get('code')
    }
    return new Promise((resolve, reject) => {
        axios.post(getEndpoint('token'),querystring.stringify(config),{
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .then ( result => {
            resolve(result.data.access_token) 
        })
        .catch( err => reject(err) )
    });
}

const LnkMe = ()=> {
    const { token } = store.get('linkedin');
    return new Promise((resolve, reject) => {
        axios.get(getEndpoint('me'),{
            headers: { 
                'Authorization': `Bearer ${token}`,
            },
        })
        .then ( response => {
            if(response.data?.id) {
                store.set('linkedin',{
                    ...store.get('linkedin'),
                    ...response.data
                })
                resolve(response.data)
            }
            reject(err)
        })
        .catch( err => reject(err) )
    });
}

const LnkLogout = () => {
    const btnExit = document.getElementById('logout');
        btnExit.addEventListener('click',()=> { 
            store.clearAll();
            btnLogin.style.display = 'block';
            wrapper.innerHTML = '';
            window.location.search = '';
            init();
        })
}

const LnkProfile = ()=> {
    const { localizedFirstName: firstname, localizedLastName: lastname  } = store.get('linkedin');
    wrapper.innerHTML = `
        Benvenuto <strong>${firstname} ${lastname}</strong> | <a href="javascript:void(0)" id="logout">Logout</a>
    `
    return;
}


const init = ()=> {
    const linkedin = store.get('linkedin');
    if( linkedin && linkedin.token ){
        btnLogin.style.display = 'none'
        LnkProfile();
        LnkLogout();
    } else if(parameters.get('code') && !linkedin?.token ){
        btnLogin.style.display = 'none'
        LnkToken()
        .then( token => store.set('linkedin',{ token: token }) )
        .then( ()=> LnkMe() )
        .then( ()=> LnkProfile() )
        .then( ()=> LnkLogout() )
        .catch( err => console.log(err) )
    } else {
        btnLogin.addEventListener('click', ()=> LnkLogin() );
    }
}

init();