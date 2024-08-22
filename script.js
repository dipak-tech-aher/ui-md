function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (sidebar.style.width === '0px' || sidebar.style.width === '') {
        sidebar.style.width = '250px';
        mainContent.style.marginLeft = '250px';
    } else {
        sidebar.style.width = '0px';
        mainContent.style.marginLeft = '0px';
    }
}
