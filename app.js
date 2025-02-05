function showTab(tabName) {
    document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
}
function toggleProject(projectId) {
    document.getElementById(projectId).classList.toggle('expanded');
}