/* Build: cc render.c -I../include -L<dir> -lreportbuilder -o render */
#include <stdio.h>
#include "reportbuilder.h"

int main(int argc, char **argv) {
    if (argc < 4) {
        fprintf(stderr, "usage: %s template.rbt.json data.json out.pdf\n", argv[0]);
        return 1;
    }
    char version[32];
    rb_version(version, sizeof version);
    char result[4096];
    int32_t rc = rb_render_file(argv[1], argv[2], argv[3], "{\"pdfa\":true}", result, sizeof result);
    printf("reportbuilder %s -> rc=%d %s\n", version, rc, result);
    return rc == RB_OK ? 0 : 2;
}
