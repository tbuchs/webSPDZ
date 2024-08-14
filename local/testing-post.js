// inserted testing-post.js to allow testing without input variables, but reading from the URL
arguments_ = [];
if(typeof window !== 'undefined')
{
	let searchParams = new URLSearchParams(window.location.search);
	if (searchParams.has('arguments')) {
		arguments_ = Array.from(searchParams.get('arguments').split(","));
	}
}
// END -- Path: local/testing-post.js