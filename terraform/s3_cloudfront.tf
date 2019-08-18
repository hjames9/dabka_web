/*
 * AWS S3 and Cloudfront Template
 */

resource "aws_s3_bucket" "b" {
    bucket = "site.thehaydenplace.org"
    acl    = "public-read"

    website {
        index_document = "index.html"
        error_document = "error.html"

    routing_rules = <<EOF
[{
    "Condition": {
        "KeyPrefixEquals": "docs/"
    },
    "Redirect": {
        "ReplaceKeyPrefixWith": "documents/"
    }
}]
EOF
    }
}

/*
resource "aws_cloudfront_distribution" "s3_distribution" {
}
*/
